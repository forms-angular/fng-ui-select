(function () {
  'use strict';

  var uiSelectModule = angular.module('fng.uiSelect', ['ui.select']);

  uiSelectModule.factory('uiSelectHelper', ['$rootScope', '$q', 'SubmissionsService', function ($rootScope, $q, SubmissionsService) {
    var lastW, lastH;
    return {
      windowChanged: function(w,h) {
        var result = false;
        if (w != lastW || h !== lastH) {
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
            })
          })
        } else {
          SubmissionsService.getListAttributes(formSchema.ref, value).then(function(response) {
            cb(formSchema, {id: value, text: response.data.list});
          })
        }
      }
    };
  }]);


  uiSelectModule.controller('FngUISelectCtrl',function($scope, $window, $timeout, $http, uiSelectHelper) {

    $scope.uiSelect = $scope.uiSelect || [];

    $scope.windowResizeUiSelect = function(checkResize) {
      // This is to stop the resize firing too often.  Really horrible way of doing it caused by some very regrettable design choices which will be factored out later
      // Actually not choices - just not knowing any better
      if (!checkResize || uiSelectHelper.windowChanged($window.innerWidth, $window.innerHeight)) {
        for (var i = 0; i < $scope.uiSelect.length; i++) {
          var selectId = $scope.uiSelect[i].selectId;
          var select = document.getElementById(selectId);
          if (select) {
            var helper = document.getElementById(selectId + '_width-helper');
            if (helper) {
              var w = helper.offsetWidth;
              if (select.offsetLeft + w > $window.innerWidth) {
                w = $window.innerWidth - select.offsetLeft - 20;
              }
              angular.element('#' + selectId).css('width', w);
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
          return $http.get('/api/search/' + elem.ref + '?q=' + searchString).then(function(response) {
            $scope[id + '_options'] = response.data.results;
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
  });

  uiSelectModule.directive('fngUiSelect', ['$compile','$window','pluginHelper', 'cssFrameworkService', 'formMarkupHelper', 'uiSelectHelper',
    function ($compile, $window, pluginHelper, cssFrameworkService, formMarkupHelper, uiSelectHelper) {
    return {
      restrict: 'E',
      controller: 'FngUISelectCtrl',
      link: function (scope, element, attr) {
        var processedAttr = pluginHelper.extractFromAttr(attr, 'fngUiSelect');
        var elemScope = {selectId: processedAttr.info.id};
        var multi = (processedAttr.info.array === 'true');
        var elementHtml;
        var input='';

        scope.uiSelect.push(elemScope);
        scope.conversions[processedAttr.info.name] = processedAttr.directiveOptions;

        // Sort out the theme, defaulting to select2 (so old users won't see the change).  Bootstrap theme only works with Bootstrap 3
        var theme = processedAttr.directiveOptions.theme || 'select2';
        if (processedAttr.info.theme === 'bootstrap' && cssFrameworkService.framework !== 'bs3') {
          theme = 'select2';
        }

        var multiControl = false;
        var multiStr = '';
        if (multi && (processedAttr.directiveOptions.fngajax === 'true' || processedAttr.directiveOptions.forcemultiple === 'true')) {
          // We need the array to be an array of objects with a x property.  This tells forms-angular to convert it by
          // adding an attribute to the schema.
          pluginHelper.findIdInSchemaAndFlagNeedX(scope.baseSchema(), processedAttr.info.id);
          multiControl = true;
        } else {
          multiStr = multi ? 'multiple close-on-select reset-search-input ' : '';
        }

        elementHtml = pluginHelper.buildInputMarkup(scope, attr.model, processedAttr.info, processedAttr.options, multiControl, multiControl, function (buildingBlocks) {
          // First of all add a hidden input field which we will use to set the width of the select
          input = '<input id="' + processedAttr.info.id + '_width-helper" class="' + buildingBlocks.sizeClassBS2 + ' ' + buildingBlocks.sizeClassBS3 + '" type="text" disabled="" style="position: absolute; top: -200px;">';

          // set up the ui-select directives
          var select = '<ui-select ' + multiStr + buildingBlocks.common + ' theme="' + theme + '" ng-disabled="disabled" style="width:300px;">';
          select += '<ui-select-match allow-clear=true placeholder="' + (processedAttr.info.placeholder || 'Select an option...') + '">';
          if (processedAttr.directiveOptions.fngajax === 'true') {
            // Set up lookup function
            scope.conversions[processedAttr.info.name].fngajax = uiSelectHelper.lookupFunc;
            // Use the forms-angular API to query the referenced collection
            elemScope.ref = processedAttr.info.ref;
            scope[processedAttr.info.id + '_options'] = [];
            if (multiControl) {
              select += '{{$select.selected.text}}';
            } else {
              select += '{{' + attr.model + '.' + processedAttr.info.name + '.text}}';
            }
            select += '</ui-select-match>';
            select += '<ui-select-choices repeat="option in ' + processedAttr.info.id + '_options track by $index" ';
            select += 'refresh="refreshOptions($select.search, \'' + processedAttr.info.id + '\')" ';
            select += 'refresh-delay="0"> ';
            select += '<div ng-bind-html="option.text"></div>';
          } else if (processedAttr.info.options) {
            // Simple case - enumerated options on the form scope
            if (multiControl) {
              select += '{{$select.selected}}';
            } else {
              select += multi ? '{{$item}}' : '{{$select.selected}}';
            }
            select += '</ui-select-match>';
            select += '<ui-select-choices repeat="option in ' + processedAttr.info.options + ' | filter:$select.search">';
            select += '<div ng-bind-html="option"></div>';
          }
          select += '</ui-select-choices>';
          select += '</ui-select>';
          return select;
        });
        element.replaceWith($compile(input + elementHtml)(scope));
      }
    }
  }]);
})();

