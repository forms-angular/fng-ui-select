describe('Lists', function () {

  var width = 1024;
  var height = 1500;

  let unique = new Date().valueOf();

  it('Creates a new record with multiple shelves', function () {
    cy.visit('/#/k_referencing_self_collection/new');
    cy.get('#f_warehouse_name').type(`m${unique} Warehouse`);
    cy.get('#add_f_shelves_btn').click().click().click();
    cy.get('#f_shelvesList_0 > .row-fluid > #cg_f_shelves_location > .controls > .ng-pristine').type('Top');
    cy.get('#f_shelvesList_1 > .row-fluid > #cg_f_shelves_location > .controls > .ng-pristine').type('Middle');
    cy.get('#f_shelvesList_2 > .row-fluid > #cg_f_shelves_location > .controls > .ng-pristine').type('Bottom');
    cy.get('#add_f_items_btn').click();
    cy.get('#f_itemsList_0 > .row-fluid > #cg_f_items_description > .controls > .ng-pristine').type('Item 1');
    cy.get('#f_itemsList_0 > .row-fluid > #cg_f_items_shelf > .controls > .ng-pristine').select('Middle');
    cy.get('#add_f_cleanedShelves').click().click();
    cy.get('#f_cleanedShelves_0').select('Middle');
    cy.get('#f_cleanedShelves_1').select('Top');
    cy.get('#f_favouriteShelf').select('Bottom');
    cy.get('#saveButton').click();
  });

  it('Creates a new record with a single shelf', function () {
    cy.visit('/#/k_referencing_self_collection/new');
    cy.get('#f_warehouse_name').type(`s${unique} Warehouse`);
    cy.get('#add_f_shelves_btn').click();
    cy.get('#f_shelvesList_0 > .row-fluid > #cg_f_shelves_location > .controls > .ng-pristine').type('Only');
    cy.get('#add_f_items_btn').click();
    cy.get('#f_itemsList_0 > .row-fluid > #cg_f_items_description > .controls > .ng-pristine').type('Item 1');
    cy.get('#f_itemsList_0 > .row-fluid > #cg_f_items_shelf > .controls > .ng-pristine').select('Only');
    cy.get('#add_f_cleanedShelves').click();
    cy.get('#f_cleanedShelves_0').select('Only');
    cy.get('#f_favouriteShelf').select('Only');
    cy.get('#saveButton').click();
  });

  it('Uses record with multiple shelves', function () {
    cy.visit('/#/l_referencing_list_in_other_document/new');
    cy.get('#f_description').type('An item in multi');
    cy.get('.select2-arrow > b').click();
    cy.get('.ui-select-search').type(`m${unique}`);
    cy.get('.select2-result-label > .ng-binding').click();
    cy.get('#f_shelf').select('Top');
  });

  it('Uses record with single shelf', function () {
    cy.visit('/#/l_referencing_list_in_other_document/new');
    cy.get('#f_description').type('An item in single');
    cy.get('.select2-arrow > b').click();
    cy.get('.ui-select-search').type(`s${unique}`);
    cy.get('.select2-result-label > .ng-binding').click();
    cy.get('#f_shelf').select('Only');
  });

});
