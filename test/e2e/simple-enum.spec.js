'use strict';

describe('Base edit form', function () {

  var browser = protractor.getInstance();
  var width = 1024;
  var height = 768;
  browser.driver.manage().window().setSize(width, height);

  it('should save display empty value as blank', function () {
    browser.get('/#/b_enhanced_schema/new');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    element(by.model('record.accepted')).click();
    $('#saveButton').click();
  });

});

