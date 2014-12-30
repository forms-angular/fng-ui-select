'use strict';


describe('Multi control', function () {

  var width = 1024;
  var height = 768;
  browser.driver.manage().window().setSize(width, height);

  it('should handle simple enum', function () {
    browser.get('/#/d_array_example/new');
    var match = $('#cg_f_yetMoreOptions .ui-select-match');
    expect(match.getText()).toEqual('');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    element(by.model('record.accepted')).click();
    var saveButton = $('#saveButton');
    saveButton.click();
    browser.switchTo().alert().then(function (alert) {alert.accept() });    // THis model has an onSave event
    expect(browser.getCurrentUrl()).toMatch('/d_array_example/[0-9a-f]{24}/edit');
    expect(match.getText()).toEqual('');
    element.all(by.css('.select2-choices input')).first().click();
    expect(element.all(by.css('.select2-drop')).first().getText()).toMatch('First');
    element.all(by.css('.select2-drop ul li ul li')).get(1).click();
    expect(match.getText()).toEqual('Second');
    element.all(by.css('input.select2-input')).first().click();
    element.all(by.css('.select2-drop ul li ul li')).get(1).click();
    expect(match.getText()).toMatch('Second');
    expect(match.getText()).toMatch('Third');
  });

  it('should handle inside cached lookups', function () {
//     Format:    { type:[Schema.Types.ObjectId], ref: 'f_nested_schema',   form: {directive: 'fng-ui-select', size: 'xxlarge' }}
    browser.get('/#/test_fng_ui_select/new');
    var match = $('#cg_f_multiInsideCached .ui-select-match');
    expect(match.getText()).toEqual('');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    var saveButton = $('#saveButton');
    saveButton.click();
    expect(browser.getCurrentUrl()).toMatch('/test_fng_ui_select/[0-9a-f]{24}/edit');
    expect(match.getText()).toEqual('');
    element.all(by.css('.select2-choices input')).get(1).click();
    expect(element.all(by.css('li.ui-select-choices-row')).first().getText()).toMatch('Brown Jenny');
    element.all(by.css('.select2-drop ul li ul li')).get(0).click();
    expect(match.getText()).toEqual('Brown Jenny');
    element.all(by.css('.select2-choices input')).get(1).click();
    expect(element.all(by.css('li.ui-select-choices-row')).first().getText()).toMatch('Brown John');
    element.all(by.css('.select2-drop ul li ul li')).get(0).click();
    expect(match.getText()).toMatch('Brown Jenny');
    expect(match.getText()).toMatch('Brown John');
    saveButton.click();
    expect(match.getText()).toMatch('Brown Jenny');
    expect(match.getText()).toMatch('Brown John');
  });

  it('should handle outside cached lookups', function () {
    // Format   [ { type: Schema.Types.ObjectId,  ref: 'f_nested_schema',   form: {directive: 'fng-ui-select', size: 'xxlarge' }} ]
    browser.get('/#/test_fng_ui_select/new');
    var match = $('#cg_f_multiOutsideCached .ui-select-match');
    expect(match.getText()).toEqual('');
    var field = element(by.model('record.surname'));
    field.clear();
    field.sendKeys('Smith');
    var saveButton = $('#saveButton');
    saveButton.click();
    expect(browser.getCurrentUrl()).toMatch('/test_fng_ui_select/[0-9a-f]{24}/edit');
    expect(match.getText()).toEqual('');
    element.all(by.css('.select2-choices input')).first().click();
    expect(element.all(by.css('li.ui-select-choices-row')).first().getText()).toMatch('Brown Jenny');
    element.all(by.css('.select2-drop ul li ul li')).get(0).click();
    expect(match.getText()).toEqual('Brown Jenny');
    element.all(by.css('.select2-choices input')).first().click();
    expect(element.all(by.css('li.ui-select-choices-row')).first().getText()).toMatch('Brown John');
    element.all(by.css('.select2-drop ul li ul li')).get(0).click();
    expect(match.getText()).toMatch('Brown Jenny');
    expect(match.getText()).toMatch('Brown John');
    saveButton.click();
    expect(match.getText()).toMatch('Brown Jenny');
    expect(match.getText()).toMatch('Brown John');
  });

  it('should convert multi ajax lookups into multiple controls', function () {
    browser.get('/#/test_fng_ui_select/new');
    element(by.id('add_f_multiOutsideAjax')).click();
    element(by.id('add_f_multiInsideAjax')).click();
  });

});


