(function () {
  'use strict';

  var uiSelectModule = angular.module('fng.uiSelect', ['ui.select']);

  uiSelectModule.factory('uiSelectHelper', ['$rootScope', '$q', 'recordHandler', 'SubmissionsService', function ($rootScope, $q, recordHandler, SubmissionsService) {
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
      } else {
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
          if (formSchema.fngUiSelect.deriveOptions) {
            const results = value.map((value) => {
              const obj = localLookups[formSchema.fngUiSelect.deriveOptions].find((test) => test.id === value);
              return { id: value, text: obj ? obj.text : "" };
            });
            cb(formSchema, results);
            if (results.length > 0) {
              setTimeout(function () {
                $rootScope.$digest();
              });
            }
          } else {
            const promises = value.map((value) => {
              const id = value.x ? (value.x.id || value.x) : value; // if it's already been converted, throw away the result of the previous conversion
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
          }
        } else if (typeof value !== "string") {
          cb(formSchema, value); // already converted
        } else if (formSchema.fngUiSelect.deriveOptions) {
          const obj = localLookups[formSchema.fngUiSelect.deriveOptions].find((test) => test.id === value);
          cb(formSchema, { id: value, text: obj ? obj.text : "" });
        } else {
          useCacheOrLookItUp(formSchema.ref, value, (text) => { cb(formSchema, { id: value, text }) });
        }
      },
      doOwnConversion: function(scope, processedAttrs, ref) {
        var id = recordHandler.getData(scope.record, processedAttrs.info.name, scope.$index);
        if (id) {
          id = id.id || id; // in case it's already been converted
          useCacheOrLookItUp(ref, id, (text) => { recordHandler.setData(scope.record, processedAttrs.info.name, scope.$index, { id, text }) });
        }
      }
    };
  }]);


  uiSelectModule.controller('FngUISelectCtrl', ['$scope', '$window', '$timeout', '$http', 'uiSelectHelper', function ($scope, $window, $timeout, $http, uiSelectHelper) {

    $scope.uiSelect = $scope.uiSelect || [];

    $scope.windowResizeUiSelect = function (checkResize) {
      // This is to stop the resize firing too often.  Really horrible way of doing it caused by some very regrettable
      // design choices which will be factored out later
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
          if (elem.filter && typeof elem.filter === "string" && elem.filter[0] === "/") {
            if (elem.filter.startsWith("/api/")) {
              console.log("WARNING! fng-ui-select is using an /api/ endpoint to refresh options - this is likely to cause security authorisation problems");
            }
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

  uiSelectModule.directive('fngUiSelect', ['$compile', 'pluginHelper', 'cssFrameworkService', 'uiSelectHelper', '$timeout',
    function ($compile, pluginHelper, cssFrameworkService, uiSelectHelper, $timeout) {
      return {
        restrict: 'E',
        controller: 'FngUISelectCtrl',
        link: function (scope, element, attrs) {

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

          const processedAttrs = pluginHelper.extractFromAttr(attrs, 'fngUiSelect');
          const id = processedAttrs.info.id;
          const uniqueId = scope.$index !== undefined ? processedAttrs.info.id + "_" + scope.$index : id;
          const elemScope = angular.extend({selectId: uniqueId}, processedAttrs.directiveOptions);
          const multi = processedAttrs.info.array;
          let elementHtml;
          let input = '';

          scope.uiSelect.push(elemScope);
          addToConversions(processedAttrs.info.name, processedAttrs.directiveOptions);

          // Sort out the theme, defaulting to select2 (so old users won't see the change).  Bootstrap theme only works with Bootstrap 3
          // and not with animate (see https://github.com/angular-ui/ui-select/issues/1731 and others)
          var theme = processedAttrs.directiveOptions.theme || 'select2';
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
          if (multi && (processedAttrs.directiveOptions.fngajax || processedAttrs.directiveOptions.forcemultiple)) {
            // We need the array to be an array of objects with a x property.  This tells forms-angular to convert it by
            // adding an attribute to the schema.
            pluginHelper.findIdInSchemaAndFlagNeedX(scope.baseSchema(), id);
            multiControl = true;
          } else {
            multiStr = multi ? 'multiple close-on-select reset-search-input ' : '';
          }

          var requiredStr = '';
          var allowClearStr = '';
          if (processedAttrs.info.required) {
            requiredStr = ' ng-required="true"';
          } else if (processedAttrs.directiveOptions.ngrequired) {
            requiredStr = ` ng-required="${processedAttrs.directiveOptions.ngrequired}"`;
          } else {
            allowClearStr = ' allow-clear';
          }
          let disabledStr = pluginHelper.genIdAndDisabledStr(scope, processedAttrs, "", { forceNg: true });

          // First of all add a hidden input field which we will use to set the width of the select
          if (!angular.element(`#${uniqueId}_width-helper`).length > 0) {
            var hiddenInputInfo = {
              id: `${uniqueId}_width-helper`,
              name: processedAttrs.info.name + '_width-helper',
              label: ''
            };
            if (processedAttrs.info.size) {
              hiddenInputInfo.size = processedAttrs.info.size;
            }
            input = pluginHelper.buildInputMarkup(
              scope,
              attrs,
              {
                processedAttrs,
                fieldInfoOverrides: hiddenInputInfo,
                ignoreFieldInfoFromAttrs: true,
                needsX: multiControl
              },
              function () {
                return '<input id="' + hiddenInputInfo.id + '" type="text" class="form-control" disabled="" aria-label="unused input" style="position: absolute; left: -4200px;">';
              }
            );
            input = input.replace('class="row', 'class="hidden-row row')
          }

          function optionsFromArray(multiControl, multi, array, arrayGetter) {
            var isObjects = scope[array] && (scope[array].isObjects || typeof scope[array][0] === "object");
            if (isObjects) {
              addToConversions(processedAttrs.info.name, {fngajax: uiSelectHelper.lookupFunc});
              uiSelectHelper.addClientLookup(arrayGetter, scope[array]);
            }
            var select = '';
            if (multiControl) {
              select += '{{$select.selected' + (isObjects ? '.text' : '') + '}}';
            } else {
              select += multi ? '{{$item' + (isObjects ? '.text' : '') + '}}' : ('{{$select.selected' + (isObjects ? '.text' : '') + '}}');
            }
            select += '</ui-select-match>';
            select += '<ui-select-choices repeat="option in ' + array + ' | filter:$select.search">';
            select += '<div ng-bind-html="option' + (isObjects ? '.text' : '') + '"></div>';
            return select;
          }

          elementHtml = pluginHelper.buildInputMarkup(
            scope,
            attrs,
            {
              processedAttrs,
              addButtons: multiControl,
              needsX: multiControl,
            },
            function (buildingBlocks) {
              var defaultPlaceholder = 'Select an option...';
              if (processedAttrs.directiveOptions.fngajax) {
                defaultPlaceholder = 'Start typing...'
              }
              // set up the ui-select directives
              // hack here.  buildingBlocks.common will almost certainly contain 'id="xxxx"', but we don't want this because the
              // id will already be in disabledStr.  remove it.
              // the right solution here would be to include an option in the params that are passed to buildInputMarkup which
              // specifies whether or not the buildingBlocks that it creates should include the id or not.
              const idIdx = buildingBlocks.common.indexOf('id="');
              if (idIdx > -1) {
                const endIdIdx = buildingBlocks.common.indexOf('"', idIdx+4);
                if (endIdIdx > -1) {
                  buildingBlocks.common = buildingBlocks.common.substring(0, idIdx) + buildingBlocks.common.substring(endIdIdx + 1);
                }
              }
              var select = '<ui-select ' + multiStr + buildingBlocks.common + requiredStr + disabledStr + ' theme="' + theme + '" style="min-width:18em;">'
              select += '<ui-select-match' + allowClearStr + ' placeholder="' + (processedAttrs.info.placeholder || defaultPlaceholder) + '">';

              if (processedAttrs.directiveOptions.fngajax) {
                // Stash any filters
                if (processedAttrs.directiveOptions.fngajax !== true) {
                  elemScope.filter = processedAttrs.directiveOptions.fngajax;
                }
                // if we have a hard-coded ref (processedAttrs.info.ref), forms-angular can perform the lookup conversion for us.
                // where processedAttrs.directiveOptions.refprop is being used instead, the ref is 'variable' - it comes from a property of scope.record, and
                // in this case, we'll need to handle the conversions ourselves.
                addToConversions(processedAttrs.info.name, {fngajax: uiSelectHelper.lookupFunc, noconvert: !!processedAttrs.directiveOptions.refprop});
                if (processedAttrs.directiveOptions.refprop) {
                  // the property that we'll be getting the ref from may not be populated yet, and might conceivably change at any time, so we
                  // need to $watch it.  buildingBlocks.modelString will be something like "record.<array>[$index].<field>".  replacing <field>
                  // with the value of refprop will give us a suitable watch expression.
                  const watchStr = buildingBlocks.modelString.substring(0, buildingBlocks.modelString.lastIndexOf(".") + 1) + processedAttrs.directiveOptions.refprop;
                  scope.$watch(watchStr, (newValue) => {
                    if (newValue && elemScope.ref !== newValue) {
                      elemScope.ref = newValue;
                      uiSelectHelper.doOwnConversion(scope, processedAttrs, elemScope.ref);
                    }
                  });
                  // we also need to re-do the conversion if the user cancels changes.  this event does fire on more than just user cancellation,
                  // so this is slightly wasteful.  but with the caching implemented by uiSelectHelper, this is no big deal.
                  scope.$on("fngCancel", () => {
                    $timeout(() => {
                      if (elemScope.ref) {
                        uiSelectHelper.doOwnConversion(scope, processedAttrs, elemScope.ref);
                      }
                    });
                  });
                } else {
                  elemScope.ref = processedAttrs.info.ref;
                }                
                scope[`${uniqueId}_options`] = [];
                if (multiControl) {
                  select += '{{$select.selected.text}}';
                } else if (processedAttrs.options.subschema) {
                  select += '{{' + attrs.model + '.' + processedAttrs.info.name.replace(processedAttrs.options.subschemaroot, processedAttrs.options.subschemaroot + '[$index]') + '.text}}';
                } else {
                  select += '{{' + buildingBlocks.modelString + '.text}}';
                }
                select += '</ui-select-match>';
                select += `<ui-select-choices repeat="option in (${uniqueId}_options) track by $index" `;
                select += `refresh="refreshOptions($select.search, '${uniqueId}')" `;
                select += 'refresh-delay="400"> ';
                select += '<div ng-bind-html="option.text" ng-attr-title="{{ option.text }}"></div>';
              } else if (processedAttrs.directiveOptions.deriveoptions) {
                if (typeof scope[processedAttrs.directiveOptions.deriveoptions] === "function") {
                  select += optionsFromArray(multiControl, multi, scope[processedAttrs.directiveOptions.deriveoptions](), processedAttrs.directiveOptions.deriveoptions);
                } else {
                  throw new Error("In fng-ui-select " + processedAttrs.directiveOptions.deriveoptions + " is not a function on the scope");
                }
              } else if (processedAttrs.info.options) {
                // Simple case - enumerated options on the form scope
                select += optionsFromArray(multiControl, multi, processedAttrs.info.options);
              } else {
                throw new Error('fng-ui-select has no means of populating select');
              }
              select += '</ui-select-choices>';
              select += '</ui-select>';
              return select;
            }
          );          
          element.append($compile(input + elementHtml)(scope));
        }
      }
    }]);
})();
