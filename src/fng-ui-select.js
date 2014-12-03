(function () {
  'use strict';

  var uiSelectModule = angular.module('fng.uiSelect', ['ui.select']);

  uiSelectModule.factory('uiSelectHelper', ['$q', 'SubmissionsService', function ($q, SubmissionsService) {
    var exports = {
      initialise : function(scope) {
        if (!scope.uiSelect) {
          scope.uiSelect = [];
        } else {
          console.log('Nothing to do');
        }
      },
      lookupFunc: function(value, formSchema, cb) {
        console.log(value);
        if (formSchema.array) {
          throw new Error('Arrays of ui-select not yet supported');
        } else {
          SubmissionsService.getListAttributes(formSchema.ref, value).then(function(response) {
            cb({id: value, text: response.data.list});
          })
        }
      }
    };

    return exports;
  }]);


  uiSelectModule.controller('FngUISelectCtrl',['$scope', '$window', '$timeout', '$http', 'uiSelectHelper', function($scope, $window, $timeout, $http, uiSelectHelper) {

    console.log('init controller');

    uiSelectHelper.initialise($scope);

    $scope.windowResizeUiSelect = function() {
      for (var i = 0; i < $scope.uiSelect.length; i++) {
        var selectId = $scope.uiSelect[i].selectId;
        var select = document.getElementById(selectId);
        var helper = document.getElementById(selectId + '_width-helper');
        var w = helper.offsetWidth;
        if (select.offsetLeft + w > $window.innerWidth) {
          w = $window.innerWidth - select.offsetLeft - 20;
        }
        angular.element('#' + selectId).css('width', w);
      }
    };

    $scope.refreshOptions = function(searchString, id) {
      var elem = _.find($scope.uiSelect, function(elem) {return elem.selectId === id});
      if (elem) {
        if (searchString.length === 0) {
          $scope[id + '_options'] = [];
        } else {
          return $http.get('/api/search/' + elem.ref + '?q=' + searchString).then(function(response) {
            var array = [];
            $scope[id + '_options'] = response.data.results;
          });
        }
      } else {
        throw new Error('Could not find uiSelect element for ' + id);
      }
    };

    angular.element($window).bind('resize', function() {
      $scope.windowResizeUiSelect();
      return $scope.$apply();
    });

    $timeout($scope.windowResizeUiSelect);
  }]);

  uiSelectModule.directive('fngUiSelect', ['$compile','$window','pluginHelper', 'cssFrameworkService', 'uiSelectHelper',
    function ($compile, $window, pluginHelper, cssFrameworkService,uiSelectHelper) {
    return {
      restrict: 'E',
      controller: 'FngUISelectCtrl',
      link: function (scope, element, attr) {
        var processedAttr = pluginHelper.extractFromAttr(attr, 'fngUiSelect');
        var elemScope = {selectId: processedAttr.info.id};
        scope.uiSelect.push(elemScope);
        scope.conversions[processedAttr.info.name] = processedAttr.directiveOptions;

        var elementHtml = pluginHelper.buildInputMarkup(scope, attr.model, processedAttr.info, processedAttr.options, function(buildingBlocks) {

          // First of all add a hidden input field which we will use to set the width of the select
          var input = '<input id="' + processedAttr.info.id + '_width-helper" class="' + buildingBlocks.sizeClassBS2 + ' ' + buildingBlocks.sizeClassBS3 + '" type="text" disabled="" style="position: absolute; top: -200px;">';

          // Sort out the theme, defaulting to select2 (so old users won't see the change).  Bootstrap theme only works with Bootstrap 3
          var theme = processedAttr.directiveOptions.theme || 'select2';
          if (processedAttr.info.theme === 'bootstrap' && cssFrameworkService.framework !== 'bs3') {
            theme = 'select2';
          }

          // set up the ui-select directives
          var select = '<ui-select ' + buildingBlocks.common + ' theme="' + theme + '" ng-disabled="disabled" reset-search-input="false" style="width:300px;">';

          if (processedAttr.directiveOptions.fngajax === 'true') {
            // Set up lookup function
            scope.conversions[processedAttr.info.name].fngajax = uiSelectHelper.lookupFunc;
            // Use the forms-angular API to query the referenced collection
            elemScope.ref = processedAttr.info.ref;
            scope[processedAttr.info.id + '_options'] = [];
            select += '<ui-select-match placeholder="Select an option...">{{' + attr.model + '.' + processedAttr.info.name + '.text}}</ui-select-match>';
            select += '<ui-select-choices repeat="option in ' + processedAttr.info.id + '_options track by $index"';
            select += 'refresh="refreshOptions($select.search, \'' + processedAttr.info.id + '\')"';
            select += 'refresh-delay="0">';
            select += '<div ng-bind-html="option.text"></div>';
          } else if (processedAttr.info.options) {
            // Simple case - enumerated options on the form scope
            select += '<ui-select-match placeholder="Select an option...">{{$select.selected}}</ui-select-match>';
            select += '<ui-select-choices repeat="option in ' + processedAttr.info.options + '">';
            select += '<div ng-bind-html="option"></div>';
          }
          select += '</ui-select-choices>';
          select += '</ui-select>';
          return input + select;
        });
        element.replaceWith($compile(elementHtml)(scope));
      }
    }
  }]);
})();

