'use strict';


describe('Single control', function () {

  var width = 1024;
  var height = 768;
  browser.driver.manage().window().setSize(width, height);

  it('should handle simple enum', function () {
    browser.get('/#/b_enhanced_schema/new');
    var match = $('a.select2-choice.ui-select-match');
    expect(match.getText()).toEqual('Choose hair colour...');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    element(by.model('record.accepted')).click();
    var saveButton = $('#saveButton');
    saveButton.click();
    expect(match.getText()).toEqual('Choose hair colour...');

    $('#cg_f_hairColour .select2-arrow').click();
    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(3).click();
    expect(match.getText()).toEqual('Fair');

    saveButton.click();
    expect(match.getText()).toEqual('Fair');
  });

  it('should handle cached table lookup', function () {
    browser.get('/#/test_fng_ui_select/new');
    var match = $('#cg_f_singleCached a.select2-choice.ui-select-match');
    expect(match.getText()).toEqual('Select an option...');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    var saveButton = $('#saveButton');
    saveButton.click();
    expect(match.getText()).toEqual('Select an option...');

    $('#cg_f_singleCached .select2-arrow').click();
    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(1).click();
    expect(match.getText()).toEqual('Jones Alan true 93');

    saveButton.click();
    expect(match.getText()).toEqual('Jones Alan true 93');
  });

  it('should handle Ajax lookup', function () {
    browser.get('/#/test_fng_ui_select/new');
    var match = $('#cg_f_singleAjax a.select2-choice.ui-select-match');
    expect(match.getText()).toEqual('Select an option...');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    var saveButton = $('#saveButton');
    saveButton.click();
    expect(match.getText()).toEqual('Select an option...');

    $('#cg_f_singleAjax .select2-arrow').click();
    field = $('#cg_f_singleAjax input.select2-input');
    field.clear();
    field.sendKeys('Is');

    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(0).click();
    expect(match.getText()).toEqual('IsAccepted John true 89');

    saveButton.click();
    expect(match.getText()).toEqual('IsAccepted John true 89');
  });

});

