(function () {
  'use strict';

  var uiSelectModule = angular.module('fng.uiSelect', ['ui.select']);

  uiSelectModule.factory('uiSelectHelper', ['$rootScope', '$q', 'SubmissionsService', function ($rootScope, $q, SubmissionsService) {
    var lastW, lastH;
    return {
      windowChanged: function(w,h) {
        var result = false;
        if (w !== lastW || h !== lastH) {
          lastW = w;
          lastH = h;
          result = true;
        }
        return result;
      },
      lookupFunc: function(value, formSchema, cb) {
        if (formSchema.array) {
          // TODO extend back end to do multiple lookups in one hit

          var promises = [];
          var results = [];
          angular.forEach(value, function(obj) {
            promises.push(SubmissionsService.getListAttributes(formSchema.ref, obj.x));
          });
          $q.all(promises).then(function(responses) {
            angular.forEach(responses, function(response) {
                results.push({x:{id:value.shift().x, text:response.data.list}});
              });
            cb(formSchema, results);
            setTimeout(function() {
              $rootScope.$digest();
            });
          });
        } else {
          SubmissionsService.getListAttributes(formSchema.ref, value).then(function(response) {
            cb(formSchema, {id: value, text: response.data.list});
          });
        }
      }
    };
  }]);


  uiSelectModule.controller('FngUISelectCtrl',['$scope', '$window', '$timeout', '$http', 'uiSelectHelper', function($scope, $window, $timeout, $http, uiSelectHelper) {

    $scope.uiSelect = $scope.uiSelect || [];

    $scope.windowResizeUiSelect = function(checkResize) {
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

    $scope.refreshOptions = function(searchString, id) {
      var elem = _.find($scope.uiSelect, function(elem) {return elem.selectId === id});
      if (elem) {
        if (searchString.length === 0) {
          $scope[id + '_options'] = [];
        } else {
          return $http.get('/api/search/' + elem.ref + '?q=' + searchString + (elem.filter?('&f='+elem.filter):'')).then(function(response) {
            if (elem.additional) {
              $scope[id + '_options'] = response.data.results.map(function(result) {result.text = result.text + (result.additional ? (', ' + result.additional) : ''); return result; });
            } else {
              $scope[id + '_options'] = response.data.results;
            }
          });
        }
      } else {
        throw new Error('Could not find uiSelect element for ' + id);
      }
    };

    angular.element($window).bind('resize', function() {
      $scope.windowResizeUiSelect(true);
      return $scope.$apply();
    });

    $timeout($scope.windowResizeUiSelect);
  }]);

  uiSelectModule.directive('fngUiSelect', ['$compile','$window','pluginHelper', 'cssFrameworkService', 'formMarkupHelper', 'uiSelectHelper',
    function ($compile, $window, pluginHelper, cssFrameworkService, formMarkupHelper, uiSelectHelper) {
    return {
      restrict: 'E',
      controller: 'FngUISelectCtrl',
      link: function (scope, element, attr) {

        function addToConversions(path, options) {
            if (Object.keys(options).length > 0) {
                var keys = path.split('.');
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
        var elemScope = angular.extend({selectId: processedAttr.info.id},processedAttr.directiveOptions);
        var multi = processedAttr.info.array;
        var elementHtml;
        var input='';

        scope.uiSelect.push(elemScope);
        addToConversions(processedAttr.info.name, processedAttr.directiveOptions);

        // Sort out the theme, defaulting to select2 (so old users won't see the change).  Bootstrap theme only works with Bootstrap 3
        var theme = processedAttr.directiveOptions.theme || 'select2';
        if (processedAttr.info.theme === 'bootstrap' && cssFrameworkService.framework !== 'bs3') {
          theme = 'select2';
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

        // First of all add a hidden input field which we will use to set the width of the select
        var hiddenInputInfo = {
          id: processedAttr.info.id + '_width-helper',
          name: processedAttr.info.name + '_width-helper',
          label: ''
        };
        if (processedAttr.info.size) {
          hiddenInputInfo.size = processedAttr.info.size;
        }
        input = pluginHelper.buildInputMarkup(scope, attr.model, hiddenInputInfo, processedAttr.options, false, multiControl, function (buildingBlocks) {
          return '<input id="' + hiddenInputInfo.id + '" type="text" class="form-control" disabled="" style="position: absolute; left: -4200px;">';
        });

        function optionsFromArray(multiControl, multi, array) {
          var select = '';
          if (multiControl) {
            select += '{{$select.selected}}';
          } else {
            select += multi ? '{{$item}}' : '{{$select.selected}}';
          }
          select += '</ui-select-match>';
          select += '<ui-select-choices repeat="option in ' + array + ' | filter:$select.search">';
          select += '<div ng-bind-html="option"></div>';
          return select;
        }

        elementHtml = pluginHelper.buildInputMarkup(scope, attr.model, processedAttr.info, processedAttr.options, multiControl, multiControl, function (buildingBlocks) {
          var defaultPlaceholder = 'Select an option...';
          if (processedAttr.directiveOptions.fngajax) {
            defaultPlaceholder = 'Start typing...'
          }
          // set up the ui-select directives
          var select = '<ui-select ' + multiStr + buildingBlocks.common + requiredStr + ' theme="' + theme + '" ng-disabled="disabled" style="width:300px;">';
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
              select += '{{' + attr.model + '.' + processedAttr.info.name.replace(processedAttr.options.subschemaroot,processedAttr.options.subschemaroot + '[$index]')  + '.text}}';
            } else {
              select += '{{' + buildingBlocks.modelString + '.text}}';
            }
            select += '</ui-select-match>';
            select += '<ui-select-choices repeat="option in (' + processedAttr.info.id + '_options) track by $index" ';
            select += 'refresh="refreshOptions($select.search, \'' + processedAttr.info.id + '\')" ';
            select += 'refresh-delay="0"> ';
            select += '<div ng-bind-html="option.text"></div>';
          } else if (processedAttr.directiveOptions.deriveoptions) {
            select += optionsFromArray(multiControl, multi, scope[processedAttr.directiveOptions.deriveoptions]());
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
        scope.content = input + elementHtml;
        element.append($compile(input + elementHtml)(scope));
      }
    }
  }]);
})();
