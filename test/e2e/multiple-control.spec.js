'use strict';

describe('Multiple controls array', function () {

  var width = 1024;
  var height = 768;
  browser.driver.manage().window().setSize(width, height);

  function addToArray(field, number) {
    var input;
    var addButton = element(by.id('add_f_' + field));
    if (!number) { number = 2; }
    for (var i = 0; i < number; i++) {
      addButton.click();
    }
  }

  function checkValues() {
    expect(element(by.id('f_evenMoreOptions_0')).getAttribute('value')).toBe('Second');
    expect(element(by.id('f_evenMoreOptions_1')).getAttribute('value')).toBe('Third');
  }

  it('should handle simple enums', function () {
    browser.get('/#/d_array_example/new');
    addToArray('evenMoreOptions');  // element(by.id('add_f_evenMoreOptions')).click()

    var array = by.css('#cg_f_evenMoreOptions a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Select an option...');
    expect(element.all(array).get(1).getText()).toEqual('Select an option...');

    // select entry with mouse
    element.all(by.css('#cg_f_evenMoreOptions span.select2-arrow')).get(0).click();
    element.all(by.css('#cg_f_evenMoreOptions .select2-result-label.ui-select-choices-row-inner')).get(1).click();
    expect(element.all(array).get(0).getText()).toEqual('Second');

    // Could not figure out how to select entry with keyboard.  This is as close as I got:
    //element.all(by.css('#cg_f_evenMoreOptions .select2-container')).get(1).click();
    //
    //expect(element.all(by.css('#cg_f_evenMoreOptions .select2-result-label.ui-select-choices-row-inner')).get(1).getText()).toEqual('Second');
    //browser.driver.switchTo().activeElement().sendKeys('Th');
    //browser.driver.switchTo().activeElement().sendKeys(protractor.Key.ENTER);
    //
    // If anyone gets this to work please put it in the other tests it should apply to below

    element.all(by.css('#cg_f_evenMoreOptions span.select2-arrow')).get(1).click();
    element.all(by.css('#cg_f_evenMoreOptions .select2-result-label.ui-select-choices-row-inner')).get(2).click();
    expect(element.all(array).get(1).getText()).toEqual('Third');

    var saveButton = $('#saveButton');
    saveButton.click();
    browser.switchTo().alert().then(function (alert) {alert.accept() });    // THis model has an onSave event
    expect(browser.getCurrentUrl()).toMatch('/d_array_example/[0-9a-f]{24}/edit');


    array = by.css('#cg_f_evenMoreOptions a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Second');
    expect(element.all(array).get(1).getText()).toEqual('Third');
  });

  it('should handle inside brackets cached table lookups', function () {
    browser.get('/#/test_fng_ui_select/new');
    addToArray('multipleInsideCached');

    var array = by.css('#cg_f_multipleInsideCached a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Select an option...');
    expect(element.all(array).get(1).getText()).toEqual('Select an option...');

    // select entry with mouse
    element.all(by.css('#cg_f_multipleInsideCached span.select2-arrow')).get(0).click();
    element.all(by.css('#cg_f_multipleInsideCached .select2-result-label.ui-select-choices-row-inner')).get(1).click();
    expect(element.all(array).get(0).getText()).toEqual('Brown John');

    element.all(by.css('#cg_f_multipleInsideCached span.select2-arrow')).get(1).click();
    element.all(by.css('#cg_f_multipleInsideCached .select2-result-label.ui-select-choices-row-inner')).get(2).click();
    expect(element.all(array).get(1).getText()).toEqual('Smith Anne');

    var saveButton = $('#saveButton');
    saveButton.click();
    expect(browser.getCurrentUrl()).toMatch('/test_fng_ui_select/[0-9a-f]{24}/edit');

    array = by.css('#cg_f_multipleInsideCached a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Brown John');
    expect(element.all(array).get(1).getText()).toEqual('Smith Anne');
  });
  
  it('should handle outside brackets cached table lookups', function () {
    browser.get('/#/test_fng_ui_select/new');
    addToArray('multipleOutsideCached');

    var array = by.css('#cg_f_multipleOutsideCached a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Select an option...');
    expect(element.all(array).get(1).getText()).toEqual('Select an option...');

    // select entry with mouse
    element.all(by.css('#cg_f_multipleOutsideCached span.select2-arrow')).get(0).click();
    element.all(by.css('#cg_f_multipleOutsideCached .select2-result-label.ui-select-choices-row-inner')).get(1).click();
    expect(element.all(array).get(0).getText()).toEqual('Brown John');

    element.all(by.css('#cg_f_multipleOutsideCached span.select2-arrow')).get(1).click();
    element.all(by.css('#cg_f_multipleOutsideCached .select2-result-label.ui-select-choices-row-inner')).get(2).click();
    expect(element.all(array).get(1).getText()).toEqual('Smith Anne');

    var saveButton = $('#saveButton');
    saveButton.click();
    expect(browser.getCurrentUrl()).toMatch('/test_fng_ui_select/[0-9a-f]{24}/edit');

    array = by.css('#cg_f_multipleOutsideCached a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Brown John');
    expect(element.all(array).get(1).getText()).toEqual('Smith Anne');
  });

  it('should handle inside brackets ajax lookup', function () {
    browser.get('/#/test_fng_ui_select/new');
    addToArray('multipleInsideAjax');

    var array = by.css('#cg_f_multipleInsideAjax a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Start typing...');
    expect(element.all(array).get(1).getText()).toEqual('Start typing...');

    // select entry with mouse
    element(by.css('#f_multipleInsideAjax_0 a span.select2-arrow')).click();
    var field = $('#f_multipleInsideAjax_0 input.select2-input');
    field.clear();
    field.sendKeys('Je');
    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(0).click();
    expect(element.all(array).get(0).getText()).toEqual('Brown, Jenny');

    element(by.css('#f_multipleInsideAjax_1 a span.select2-arrow')).click();
    field = $('#f_multipleInsideAjax_1 input.select2-input');
    field.clear();
    field.sendKeys('Jo');
    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(0).click()
    expect(element.all(array).get(1).getText()).toEqual('Brown, John');

    var saveButton = $('#saveButton');
    saveButton.click();
    expect(browser.getCurrentUrl()).toMatch('/test_fng_ui_select/[0-9a-f]{24}/edit');

    expect(element.all(array).get(0).getText()).toEqual('Brown Jenny');
    expect(element.all(array).get(1).getText()).toEqual('Brown John');
  });

  it('should handle outside brackets ajax lookup', function () {
    browser.get('/#/test_fng_ui_select/new');
    addToArray('multipleOutsideAjax');

    var array = by.css('#cg_f_multipleOutsideAjax a.select2-choice.ui-select-match');
    expect(element.all(array).get(0).getText()).toEqual('Start typing...');
    expect(element.all(array).get(1).getText()).toEqual('Start typing...');

    // select entry with mouse
    element(by.css('#f_multipleOutsideAjax_0 a span.select2-arrow')).click();
    var field = $('#f_multipleOutsideAjax_0 input.select2-input');
    field.clear();
    field.sendKeys('Je');
    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(0).click();
    expect(element.all(array).get(0).getText()).toEqual('Brown, Jenny');

    element(by.css('#f_multipleOutsideAjax_1 a span.select2-arrow')).click();
    field = $('#f_multipleOutsideAjax_1 input.select2-input');
    field.clear();
    field.sendKeys('Jo');
    element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(0).click()
    expect(element.all(array).get(1).getText()).toEqual('Brown, John');

    var saveButton = $('#saveButton');
    saveButton.click();
    expect(browser.getCurrentUrl()).toMatch('/test_fng_ui_select/[0-9a-f]{24}/edit');

    expect(element.all(array).get(0).getText()).toEqual('Brown Jenny');
    expect(element.all(array).get(1).getText()).toEqual('Brown John');
  });
  
});
