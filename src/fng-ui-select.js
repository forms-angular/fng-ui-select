(function () {
  'use strict';

  var app = angular.module('fng.uiSelect', ['ui.select']);

  app.controller('FngUISelectCtrl',['$scope', '$window', '$timeout', function($scope, $window, $timeout) {

    $scope.selectId = '';

    $scope.windowResize = function() {
      var select = angular.element('#' + $scope.selectId);
      var selectHtml = document.getElementById($scope.selectId);
      var helper = document.getElementById($scope.selectId + '_width-helper');
      var w = helper.offsetWidth;
      if (selectHtml.offsetLeft + w > $window.innerWidth) {
        w = $window.innerWidth - selectHtml.offsetLeft - 20;
      }
      select.css('width',w);
    };

    angular.element($window).bind('resize', function() {
      $scope.windowResize();
      return $scope.$apply();
    });

    $timeout($scope.windowResize);
  }]);

  app.directive('fngUiSelect', ['$compile','$window','pluginHelper', 'cssFrameworkService',
    function ($compile, $window, pluginHelper, cssFrameworkService) {
    return {
      restrict: 'E',
      controller: 'FngUISelectCtrl',
      link: function (scope, element, attr) {
        var processedAttr = pluginHelper.extractFromAttr(attr);
        scope.selectId = processedAttr.info.id;

        var elementHtml = pluginHelper.buildInputMarkup(scope, attr.model, processedAttr.info, processedAttr.options, function(buildingBlocks) {

          // First of all add a hidden input field which we will use to set the width of the select
          var input = '<input id="' + processedAttr.info.id + '_width-helper" class="' + buildingBlocks.sizeClassBS2 + ' ' + buildingBlocks.sizeClassBS3 + '" type="text" disabled="" style="position: absolute; top: -200px;">';

          // Sort out the theme, defaulting to select2 (so old users won't see the change).  Bootstrap theme only works with Bootstrap 3
          var theme = processedAttr.info.theme || 'select2';
          if (processedAttr.info.theme === 'bootstrap' && cssFrameworkService.framework !== 'bs3') {
            theme = 'select2';
          }

          // set up the ui-select directives
          var select = '<ui-select ' + buildingBlocks.common + ' theme="' + theme + '" ng-disabled="disabled" reset-search-input="false" style="width:300px;">';
          select += '<ui-select-match placeholder="Select an option...">{{$select.selected}}</ui-select-match>';
          select += '<ui-select-choices repeat="option in ' + processedAttr.info.options + '">';
          select += '<div ng-bind-html="option"></div>';
          select += '</ui-select-choices>';
          select += '</ui-select>';

          return input + select;
        });
        element.replaceWith($compile(elementHtml)(scope));
        console.log('Compile done');
      }
    }
  }]);
})();

