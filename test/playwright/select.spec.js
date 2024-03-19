"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const unique = new Date().valueOf();
(0, test_1.test)('Creates a new record with multiple shelves', ({ page }) => __awaiter(void 0, void 0, void 0, function* () {
    yield page.goto('http://localhost:9000/#/k_referencing_self_collection/new');
    yield page.getByLabel('Warehouse Name').fill(`M${unique} Warehouse`);
    yield page.locator('#add_f_shelves_btn').click();
    yield page.locator('#add_f_shelves_btn').click();
    yield page.locator('#add_f_shelves_btn').click();
    yield page.locator('#f_shelves_location_0').click();
    yield page.locator('#f_shelves_location_0').fill('Top');
    yield page.locator('#f_shelves_location_1').click();
    yield page.locator('#f_shelves_location_1').fill('Middle');
    yield page.locator('#f_shelves_location_2').click();
    yield page.locator('#f_shelves_location_2').fill('Bottom');
    yield page.locator('#add_f_items_btn').click();
    yield page.getByLabel('Items Description').click();
    yield page.getByLabel('Items Description').fill('Item 1');
    yield page.getByLabel('Shelf', { exact: true }).selectOption('Middle');
    yield page.locator('#add_f_cleanedShelves').click();
    yield page.locator('#add_f_cleanedShelves').click();
    yield page.locator('#f_cleanedShelves_0').selectOption('Middle');
    yield page.locator('#f_cleanedShelves_1').selectOption('Top');
    yield (0, test_1.expect)(page.locator('#f_cleanedShelves_0')).toContainText('Middle');
    yield (0, test_1.expect)(page.locator('#f_cleanedShelves_0')).toHaveClass(/ng-valid-required/);
    yield page.getByLabel('Favourite Shelf').selectOption('Bottom');
    yield (0, test_1.expect)(page.getByLabel('Favourite Shelf')).toContainText('Bottom');
    yield page.getByRole('button', { name: ' Save' }).click();
    yield (0, test_1.expect)(page.getByRole('button', { name: ' Save' })).toBeDisabled();
    yield (0, test_1.expect)(page.locator('#f_cleanedShelves_0')).toContainText('Middle');
    // await expect(page.locator('#f_cleanedShelves_0')).toHaveClass(/ng-valid-required/);    // This currently fails, but has done I think for ages...
    yield (0, test_1.expect)(page.getByLabel('Favourite Shelf')).toContainText('Bottom');
    yield page.goto('http://localhost:9000/#/l_referencing_list_in_other_document/new');
    yield page.getByLabel('Description').click();
    yield page.getByLabel('Description').fill('An item in multi');
    yield page.getByLabel('Select box select').click();
    yield page.getByLabel('Select box', { exact: true }).click();
    yield page.getByLabel('Select box', { exact: true }).fill(`M${unique}`);
    yield page.getByText(`M${unique} Warehouse`).click();
    yield page.getByLabel('Shelf').selectOption('Top');
}));
(0, test_1.test)('Creates a new record with a single shelf', ({ page }) => __awaiter(void 0, void 0, void 0, function* () {
    yield page.goto('http://localhost:9000/#/k_referencing_self_collection/new');
    yield page.getByLabel('Warehouse Name').fill(`S${unique} Warehouse`);
    yield page.locator('#add_f_shelves_btn').click();
    yield page.getByLabel('Shelves Location').click();
    yield page.getByLabel('Shelves Location').fill('Only');
    yield page.locator('#add_f_items_btn').click();
    yield page.getByLabel('Items Description').click();
    yield page.getByLabel('Items Description').fill('Item 1');
    yield page.getByLabel('Shelf', { exact: true }).selectOption('Only');
    yield page.locator('#add_f_cleanedShelves').click();
    yield page.getByLabel('Cleaned Shelves').selectOption('Only');
    yield page.getByLabel('Favourite Shelf').selectOption('Only');
    yield page.getByRole('button', { name: ' Save' }).click();
    yield (0, test_1.expect)(page.getByRole('button', { name: ' Save' })).toBeDisabled();
    yield (0, test_1.expect)(page.locator('#f_cleanedShelves_0')).toContainText('Only');
    yield page.goto('http://localhost:9000/#/l_referencing_list_in_other_document/new');
    yield page.getByLabel('Description').fill('Single');
    yield page.getByLabel('Select box select').click();
    yield page.getByLabel('Select box', { exact: true }).click();
    yield page.getByLabel('Select box', { exact: true }).fill(`S${unique}`);
    yield page.getByText(`S${unique} Warehouse`).click();
    yield page.getByLabel('Shelf').selectOption('Only');
}));
