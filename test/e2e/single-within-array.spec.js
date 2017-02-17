'use strict';


describe('Single control in array', function () {

    var width = 1024;
    var height = 768;
    browser.driver.manage().window().setSize(width, height);

    it('should handle simple enum', function () {
        browser.get('/#/test_nested_select/new');

        var field = element(by.model('record.surname'));
        field.clear();
        field.sendKeys('Smith');
        field = element(by.model('record.forename'));
        field.clear();
        field.sendKeys('One');
        element(by.css('#add_f_nested_btn')).click();
        field = element(by.model('record.nested[$index].someText'));
        field.clear();
        field.sendKeys('Sometext One');

        $('#cg_f_nested_anEnum .select2-arrow').click();
        element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(2).click();
        expect(element(by.css('#cg_f_nested_anEnum .select2-choice.ui-select-match')).getText()).toMatch('C Option');
        element(by.css('#saveButton')).click();
        expect(element(by.css('#cg_f_nested_anEnum .select2-choice.ui-select-match')).getText()).toMatch('C Option');
    });

    it('should handle cached table lookup', function () {
        browser.get('/#/test_nested_select/new');

        var field = element(by.model('record.surname'));
        field.clear();
        field.sendKeys('Smith');
        field = element(by.model('record.forename'));
        field.clear();
        field.sendKeys('One');
        element(by.css('#add_f_nested_btn')).click();
        field = element(by.model('record.nested[$index].someText'));
        field.clear();
        field.sendKeys('Sometext One');

        $('#cg_f_nested_singleCached .select2-arrow').click();
        element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(1).click();
        expect(element(by.css('#cg_f_nested_singleCached .select2-choice.ui-select-match')).getText()).toMatch('Jones Alan');
        element(by.css('#saveButton')).click();
        expect(element(by.css('#cg_f_nested_singleCached .select2-choice.ui-select-match')).getText()).toMatch('Jones Alan');
    });

    it('should handle Ajax lookup', function () {
        browser.get('/#/test_nested_select/new');

        var field = element(by.model('record.surname'));
        field.clear();
        field.sendKeys('Smith');
        field = element(by.model('record.forename'));
        field.clear();
        field.sendKeys('One');
        element(by.css('#add_f_nested_btn')).click();
        field = element(by.model('record.nested[$index].someText'));
        field.clear();
        field.sendKeys('Sometext One');

        $('#cg_f_nested_singleAjax .select2-arrow').click();
        field = $('#cg_f_nested_singleAjax input.select2-input');
        field.clear();
        field.sendKeys('Is');
        element.all(by.css('#ui-select-choices-row-2-0')).first().click();
        expect(element(by.css('#cg_f_nested_singleAjax .select2-choice.ui-select-match')).getText()).toMatch('IsAccepted John true 89');
        element(by.css('#saveButton')).click();
        expect(element(by.css('#cg_f_nested_singleAjax .select2-choice.ui-select-match')).getText()).toMatch('IsAccepted John true 89');
    });

    it('should handle filtered Ajax lookup', function () {
        browser.get('/#/test_fng_ui_select/new');
        var match = $('#cg_f_filteredAjax a.select2-choice.ui-select-match');
        expect(match.getText()).toEqual('Start typing...');
        $('#cg_f_filteredAjax .select2-arrow').click();
        var field = $('#cg_f_filteredAjax input.select2-input');
        field.clear();
        field.sendKeys('J');

        expect(element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).count()).toEqual(1);
        element.all(by.css('.select2-result-label.ui-select-choices-row-inner')).get(0).click();
        expect(match.getText()).toMatch('Jones Alan true 93');
        element(by.css('#saveButton')).click();
        match = $('#cg_f_filteredAjax a.select2-choice.ui-select-match');
        expect(match.getText()).toMatch('Jones Alan true 93');
    });

});


