(function () {
  'use strict';

  var uiSelectModule = angular.module('fng.uiSelect', ['ui.select']);

  uiSelectModule.factory('uiSelectHelper', ['$rootScope', '$q', 'SubmissionsService', function ($rootScope, $q, SubmissionsService) {
    var lastW, lastH;
    const localLookups = {};
    // this ultra-simple cache stores { [id: string]: stringValue } as a means of avoiding unnecessary network round-trips, and the UI refresh
    // lagging caused by the promises used to make them.
    // there is no cache life-span because all we're storing here is the concatenation of records' list fields, and the chances of those
    // changing while present in this cache is miniscule.  even if they did change, displaying a stale record description in a picklist
    // would surely not cause any great concern.
    // there is no cache size limit because we're storing tiny amounts of data.
    // NB: this cache assumes that record ids are unique across all resources (as is the case with a standard MongoDB back-end).
    // TODO: provide an alternative implementation that includes the resourceName in the cache ids to avoid this limitation.
    let valueCache = {};
    // we're going to populate the select with this value whenever a SubmissionsService.getListAttributes(...) call is rejected.  because we're
    // only asking for list fields, permissions should not be the cause of failures, making "record not found" (where the foreign key
    // reference has been broken) by far the most likely explanation.
    // TODO: interpret the actual error condition and translate this into a user-friendly message
    const RECORD_NOT_FOUND = "record not found";

    function useCacheOrLookItUp(resourceName, id, cb) {
      if (valueCache[id]) {
        cb(valueCache[id]);
      } else 
        var text;
        SubmissionsService.getListAttributes(resourceName, id)
          .then((response) => {
            text = response.data.list;
          })
          .catch(() => {
            text = RECORD_NOT_FOUND; // cache this as well as there's no point in repeatedly performing a failing lookup
          })
          .finally(() => {
            cb(text);
            valueCache[id] = text;
          })
    }
    return {
      windowChanged: function (w, h) {
        var result = false;
        if (w !== lastW || h !== lastH) {
          lastW = w;
          lastH = h;
          result = true;
        }
        return result;
      },
      addClientLookup: function (lkpName, lkpData) {
        localLookups[lkpName] = lkpData;
      },
      clearCache: function () {
        valueCache = {};
      },
      lookupFunc: function (value, formSchema, cb) {
        if (formSchema.array) {
          const promises = value.map((value) => {
            let id = value.x;
            // if it's already been converted, throw away the result of the previous conversion
            if (id && id.id) {
              id = id.id;
            }
            if (!id) {
              return $q.resolve({ data: { list: ""} }); // nothing to convert
            } else if (valueCache[id]) {
              return $q.resolve({ data: { list: valueCache[id] }}); // already cached
            } else {
              return SubmissionsService.getListAttributes(formSchema.ref, id); // need to look it up
            }
          });
          // TODO: no error handling here
          // TODO: perform lookups of cache misses using a single round-trip
          $q.all(promises).then((responses) => {
            const results = responses.map((response) => {
              let id = value.shift().x;
              id = id.id || id; // in case it's already been converted
              const text = response.data.list
              valueCache[id] = text; // cache it for next time
              return { id, text }
            });
            cb(formSchema, results);
            setTimeout(function () {
              $rootScope.$digest();
            });
          });
        } else if (typeof value !== "string") {
          cb(formSchema, value); // already converted
        } else if (formSchema.fngUiSelect.deriveOptions) {
          const obj = localLookups[formSchema.fngUiSelect.deriveOptions].find((test) => test.id === value);
          cb(formSchema, { id: value, text: obj ? obj.text : "" });
        } else {
          useCacheOrLookItUp(formSchema.ref, value, (text) => { cb(formSchema, { id: value, text }) });
        }
      },
    };
  }]);


  uiSelectModule.controller('FngUISelectCtrl', ['$scope', '$window', '$timeout', '$http', 'uiSelectHelper', function ($scope, $window, $timeout, $http, uiSelectHelper) {

    $scope.uiSelect = $scope.uiSelect || [];

    $scope.windowResizeUiSelect = function (checkResize) {
      // This is to stop the resize firing too often.  Really horrible way of doing it caused by some very regrettable design choices which will be factored out later
      // Actually not choices - just not knowing any better
      if (!checkResize || uiSelectHelper.windowChanged($window.innerWidth, $window.innerHeight)) {
        for (var i = 0; i < $scope.uiSelect.length; i++) {
          var selectId = $scope.uiSelect[i].selectId;
          var select = document.getElementById(selectId);
          if (select && select.offsetParent) {
            var helper = document.getElementById(selectId + '_width-helper');
            if (helper) {
              var w = helper.offsetWidth;
              if (select.offsetLeft + w > $window.innerWidth) {
                w = $window.innerWidth - select.offsetLeft - 20;
              }
              angular.element(document.getElementById(selectId)).css('width', w);
            } else {
              console.log('No helper element found for ' + selectId);
            }
          }
        }
      }
    };

    $scope.refreshOptions = function (searchString, id) {
      var elem = _.find($scope.uiSelect, function (elem) {
        return elem.selectId === id
      });
      if (elem) {
        if (searchString.length === 0) {
          $scope[id + '_options'] = [];
        } else {
          var promise;
          if (elem.filter && elem.filter[0] === '/') {
            // HACK We want to pass the existing record in e, but we can fall foul of 431 errors if it is large, so we test for that
            // using an arbitrary number and if so just send the _id (on the assumption that large records won't be new so will have an _id).
            // According to https://stackoverflow.com/questions/57431355/how-to-fix-431-request-header-fields-too-large-in-react-redux-app the limit is 8KB
            // but I have seen it fail at about 5k...
            var record = JSON.stringify($scope.record).length >= (4 * 1024) ? {_id: $scope.record._id} : $scope.record;
            // Custom URL
            promise = $http({
              method: 'GET',
              url: elem.filter,
              params: {
                q: searchString,
                e: record,
                i: $scope.$index
              },
              cache: false
            });
          } else {
            promise = $http.get('/api/search/' + elem.ref + '?q=' + searchString + (elem.filter ? ('&f=' + elem.filter) : ''));
          }
          promise.then(function (response) {
            if (response.status >= 400) {
              throw new Error(response.statusMessage)
            } else {
              if (elem.additional) {
                $scope[id + '_options'] = response.data.results.map(function (result) {
                  result.text = result.text + (result.additional ? (', ' + result.additional) : '');
                  return result;
                });
              } else {
                $scope[id + '_options'] = response.data.results;
              }
            }
          })
          .catch(function(err) {
            var msg;
            if (err && err.data && err.data.message) {
              msg = err.data.message;
            } else {
              msg = 'Error ' + err.status + ': ' + err.statusText + ' - ' + err.data;
            }
            $scope.showError(msg);
          });
        }
      } else {
        throw new Error('Could not find uiSelect element for ' + id);
      }
    };

    angular.element($window).bind('resize', function () {
      $scope.windowResizeUiSelect(true);
      return $scope.$apply();
    });

    $timeout($scope.windowResizeUiSelect);
  }]);

  uiSelectModule.directive('fngUiSelect', ['$compile', '$window', 'pluginHelper', 'cssFrameworkService', 'formMarkupHelper', 'uiSelectHelper',
    function ($compile, $window, pluginHelper, cssFrameworkService, formMarkupHelper, uiSelectHelper) {
      return {
        restrict: 'E',
        controller: 'FngUISelectCtrl',
        link: function (scope, element, attr) {

          function addToConversions(path, options) {
            if (Object.keys(options).length > 0) {
              var keys = path.split('.');
              if (!scope.conversions) {
                  scope.conversions = {};
              }
              var target = scope.conversions;
              for (var i = 0; i < keys.length; i++) {
                var thisKey = keys[i];
                target[thisKey] = target[thisKey] || {};
                target = target[thisKey];
              }
              angular.extend(target, options);
            }
          }

          var processedAttr = pluginHelper.extractFromAttr(attr, 'fngUiSelect');
          var elemScope = angular.extend({selectId: processedAttr.info.id}, processedAttr.directiveOptions);
          var multi = processedAttr.info.array;
          var elementHtml;
          var input = '';

          scope.uiSelect.push(elemScope);
          addToConversions(processedAttr.info.name, processedAttr.directiveOptions);

          // Sort out the theme, defaulting to select2 (so old users won't see the change).  Bootstrap theme only works with Bootstrap 3
          // and not with animate (see https://github.com/angular-ui/ui-select/issues/1731 and others)
          var theme = processedAttr.directiveOptions.theme || 'select2';
          if (theme === 'bootstrap') {
            if (cssFrameworkService.framework() !== 'bs3') {
              theme = 'select2';
            } else {
              try {
                if (angular.module('ngAnimate')) {
                  theme = 'select2';
                }
              } catch(e) {
                ;    // module not present, so bootstrap theme will work
              }
            }
          }

          var multiControl = false;
          var multiStr = '';
          if (multi && (processedAttr.directiveOptions.fngajax || processedAttr.directiveOptions.forcemultiple)) {
            // We need the array to be an array of objects with a x property.  This tells forms-angular to convert it by
            // adding an attribute to the schema.
            pluginHelper.findIdInSchemaAndFlagNeedX(scope.baseSchema(), processedAttr.info.id);
            multiControl = true;
          } else {
            multiStr = multi ? 'multiple close-on-select reset-search-input ' : '';
          }

          var requiredStr = '';
          var allowClearStr = '';
          if (processedAttr.info.required) {
            requiredStr = ' ng-required="true"';
          } else {
            allowClearStr = ' allow-clear';
          }
          var disabledStr = '';
          if (processedAttr.directiveOptions.ngdisabled) {
            disabledStr = ` ng-disabled="${processedAttr.directiveOptions.ngdisabled}"`
          } else {
            disabledStr = ' ng-disabled="disabled"';
          }

          // First of all add a hidden input field which we will use to set the width of the select
          if (!angular.element('#' + processedAttr.info.id + '_width-helper').length > 0) {
            var hiddenInputInfo = {
              id: processedAttr.info.id + '_width-helper',
              name: processedAttr.info.name + '_width-helper',
              label: ''
            };
            if (processedAttr.info.size) {
              hiddenInputInfo.size = processedAttr.info.size;
            }
            input = pluginHelper.buildInputMarkup(scope, attr.model, hiddenInputInfo, processedAttr.options, false, multiControl, function (buildingBlocks) {
              return '<input id="' + hiddenInputInfo.id + '" type="text" class="form-control" disabled="" aria-label="unused input" style="position: absolute; left: -4200px;">';
            });
            input = input.replace('class="row', 'class="hidden-row row')
          }

          function optionsFromArray(multiControl, multi, array, arrayGetter) {
            var isObjects = scope[array] && (scope[array].isObjects || typeof scope[array][0] === "object");
            if (isObjects) {
              addToConversions(processedAttr.info.name, {fngajax: uiSelectHelper.lookupFunc});
              uiSelectHelper.addClientLookup(arrayGetter, scope[array]);
            }
            var select = '';
            if (multiControl) {
              select += '{{$select.selected' + (isObjects ? '.text' : '') + '}}';
            } else {
              select += multi ? '{{$item}}' : ('{{$select.selected' + (isObjects ? '.text' : '') + '}}');
            }
            select += '</ui-select-match>';
            select += '<ui-select-choices repeat="option in ' + array + ' | filter:$select.search">';
            select += '<div ng-bind-html="option' + (isObjects ? '.text' : '') + '"></div>';
            return select;
          }

          elementHtml = pluginHelper.buildInputMarkup(scope, attr.model, processedAttr.info, processedAttr.options, multiControl, multiControl, function (buildingBlocks) {
            var defaultPlaceholder = 'Select an option...';
            if (processedAttr.directiveOptions.fngajax) {
              defaultPlaceholder = 'Start typing...'
            }
            // set up the ui-select directives
            var select = '<ui-select ' + multiStr + buildingBlocks.common + requiredStr + disabledStr + ' theme="' + theme + '" style="min-width:18em;">'
            select += '<ui-select-match' + allowClearStr + ' placeholder="' + (processedAttr.info.placeholder || defaultPlaceholder) + '">';


            if (processedAttr.directiveOptions.fngajax) {
              // Stash any filters
              if (processedAttr.directiveOptions.fngajax !== true) {
                elemScope.filter = processedAttr.directiveOptions.fngajax;
              }
              // Set up lookup function
              addToConversions(processedAttr.info.name, {fngajax: uiSelectHelper.lookupFunc});
              // Use the forms-angular API to query the referenced collection
              elemScope.ref = processedAttr.info.ref;
              scope[processedAttr.info.id + '_options'] = [];
              if (multiControl) {
                select += '{{$select.selected.text}}';
              } else if (processedAttr.options.subschema) {
                select += '{{' + attr.model + '.' + processedAttr.info.name.replace(processedAttr.options.subschemaroot, processedAttr.options.subschemaroot + '[$index]') + '.text}}';
              } else {
                select += '{{' + buildingBlocks.modelString + '.text}}';
              }
              select += '</ui-select-match>';
              select += '<ui-select-choices repeat="option in (' + processedAttr.info.id + '_options) track by $index" ';
              select += 'refresh="refreshOptions($select.search, \'' + processedAttr.info.id + '\')" ';
              select += 'refresh-delay="100"> ';
              select += '<div ng-bind-html="option.text"></div>';
            } else if (processedAttr.directiveOptions.deriveoptions) {
              if (typeof scope[processedAttr.directiveOptions.deriveoptions] === "function") {
                select += optionsFromArray(multiControl, multi, scope[processedAttr.directiveOptions.deriveoptions](), processedAttr.directiveOptions.deriveoptions);
              } else {
                throw new Error("In fng-ui-select " + processedAttr.directiveOptions.deriveoptions + " is not a function on the scope");
              }
            } else if (processedAttr.info.options) {
              // Simple case - enumerated options on the form scope
              select += optionsFromArray(multiControl, multi, processedAttr.info.options);
            } else {
              throw new Error('fng-ui-select has no means of populating select');
            }
            select += '</ui-select-choices>';
            select += '</ui-select>';
            return select;
          });
          element.append($compile(input + elementHtml)(scope));
        }
      }
    }]);
})();
