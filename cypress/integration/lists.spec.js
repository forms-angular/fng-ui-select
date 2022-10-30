"use strict";
describe('Lists', function () {
    var width = 1800;
    var height = 1500;
    var unique = new Date().valueOf();
    beforeEach(function () {
        cy.viewport(width, height);
    });
    it('Creates a new record with multiple shelves', function () {
        cy.visit('/#/k_referencing_self_collection/new');
        cy.get('#f_warehouse_name').type("m".concat(unique, " Warehouse"));
        cy.get('#add_f_shelves_btn').click().click().click();
        cy.get('#f_shelves_location_0').type('Top');
        cy.get('#f_shelves_location_1').type('Middle');
        cy.get('#f_shelves_location_2').type('Bottom');
        cy.get('#add_f_items_btn').click();
        cy.get('#f_items_description_0').type('Item 1');
        cy.get('#f_items_shelf_0').select('Middle');
        cy.get('#add_f_cleanedShelves').click().click();
        cy.get('#f_cleanedShelves_0').select('Middle');
        cy.get('#f_cleanedShelves_1').select('Top');
        cy.get('#f_favouriteShelf').select('Bottom');
        cy.get('#saveButton').click();
    });
    it('Creates a new record with a single shelf', function () {
        cy.visit('/#/k_referencing_self_collection/new');
        cy.get('#f_warehouse_name').type("s".concat(unique, " Warehouse"));
        cy.get('#add_f_shelves_btn').click();
        cy.get('#f_shelves_location_0').type('Only');
        cy.get('#add_f_items_btn').click();
        cy.get('#f_items_description_0').type('Item 1');
        cy.get('#f_items_shelf_0').select('Only');
        cy.get('#add_f_cleanedShelves').click();
        cy.get('#f_cleanedShelves_0').select('Only');
        cy.get('#f_favouriteShelf').select('Only');
        cy.get('#saveButton').click();
    });
    it('Uses record with multiple shelves', function () {
        cy.visit('/#/l_referencing_list_in_other_document/new');
        cy.get('#f_description').type('An item in multi');
        cy.get('.select2-arrow > b').click();
        cy.get('.ui-select-search').type("m".concat(unique));
        cy.get('.select2-result-label > .ng-binding').click();
        cy.get('#f_shelf').select('Top');
    });
    it('Uses record with single shelf', function () {
        cy.visit('/#/l_referencing_list_in_other_document/new');
        cy.get('#f_description').type('An item in single');
        cy.get('.select2-arrow > b').click();
        cy.get('.ui-select-search').type("s".concat(unique));
        cy.get('.select2-result-label > .ng-binding').click();
        cy.get('#f_shelf').select('Only');
    });
});
