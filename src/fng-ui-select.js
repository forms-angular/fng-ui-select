(function () {
  'use strict';

  var uiSelectModule = angular.module('fng.uiSelect', ['ui.select']);

  uiSelectModule.factory('uiSelectHelper', ['$rootScope', '$q', 'SubmissionsService', function ($rootScope, $q, SubmissionsService) {
    var lastW, lastH;
    var localLookups = {};
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
      lookupFunc: function (value, formSchema, cb) {
        if (formSchema.array) {
          // TODO extend back end to do multiple lookups in one hit

          var promises = [];
          var results = [];
          angular.forEach(value, function (obj) {
            promises.push(SubmissionsService.getListAttributes(formSchema.ref, obj.x));
          });
          $q.all(promises).then(function (responses) {
            angular.forEach(responses, function (response) {
              results.push({x: {id: value.shift().x, text: response.data.list}});
            });
            cb(formSchema, results);
            setTimeout(function () {
              $rootScope.$digest();
            });
          });
        } else if (formSchema.fngUiSelect.deriveOptions) {
          var retVal;
          if (typeof value === 'string') {
            var obj = localLookups[formSchema.fngUiSelect.deriveOptions].find(function (test) {
              return test.id == value
            });
            retVal = {id: value, text: obj ? obj.text : ''}
          } else {
            retVal = value;
          }
          cb(formSchema, retVal);
        } else {
          if (typeof value === 'string') {
            SubmissionsService.getListAttributes(formSchema.ref, value).then(function (response) {
              cb(formSchema, {id: value, text: response.data.list});
            });
          } else {
            cb(formSchema, value);
          }
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

  uiSelectModule.directive('fngUiSelect', ['$compile', 'pluginHelper', 'cssFrameworkService', 'uiSelectHelper',
    function ($compile, pluginHelper, cssFrameworkService, uiSelectHelper) {
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
          const elemScope = angular.extend({selectId: id}, processedAttrs.directiveOptions);
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
          } else {
            allowClearStr = ' allow-clear';
          }
          let disabledStr = pluginHelper.genIdAndDisabledStr(scope, processedAttrs, "", { forceNg: true });

          // First of all add a hidden input field which we will use to set the width of the select
          if (!angular.element(`#${id}_width-helper`).length > 0) {
            var hiddenInputInfo = {
              id: `${id}_width-helper`,
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
              select += multi ? '{{$item}}' : ('{{$select.selected' + (isObjects ? '.text' : '') + '}}');
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
                // Set up lookup function
                addToConversions(processedAttrs.info.name, {fngajax: uiSelectHelper.lookupFunc});
                // Use the forms-angular API to query the referenced collection
                elemScope.ref = processedAttrs.info.ref;
                scope[`${id}_options`] = [];
                if (multiControl) {
                  select += '{{$select.selected.text}}';
                } else if (processedAttrs.options.subschema) {
                  select += '{{' + attrs.model + '.' + processedAttrs.info.name.replace(processedAttrs.options.subschemaroot, processedAttrs.options.subschemaroot + '[$index]') + '.text}}';
                } else {
                  select += '{{' + buildingBlocks.modelString + '.text}}';
                }
                select += '</ui-select-match>';
                select += `<ui-select-choices repeat="option in (${id}_options) track by $index" `;
                select += `refresh="refreshOptions($select.search, '${id}')" `;
                select += 'refresh-delay="100"> ';
                select += '<div ng-bind-html="option.text"></div>';
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
