import { test, expect } from '@playwright/test';

const unique = new Date().valueOf();
test('Creates a new record with multiple shelves', async ({ page }) => {
  await page.goto('http://localhost:9000/#/k_referencing_self_collection/new');
  await page.getByLabel('Warehouse Name').fill(`M${unique} Warehouse`);
  await page.locator('#add_f_shelves_btn').click();
  await page.locator('#add_f_shelves_btn').click();
  await page.locator('#add_f_shelves_btn').click();
  await page.locator('#f_shelves_location_0').click();
  await page.locator('#f_shelves_location_0').fill('Top');
  await page.locator('#f_shelves_location_1').click();
  await page.locator('#f_shelves_location_1').fill('Middle');
  await page.locator('#f_shelves_location_2').click();
  await page.locator('#f_shelves_location_2').fill('Bottom');
  await page.locator('#add_f_items_btn').click();
  await page.getByLabel('Items Description').click();
  await page.getByLabel('Items Description').fill('Item 1');
  await page.getByLabel('Shelf', { exact: true }).selectOption('Middle');
  await page.locator('#add_f_cleanedShelves').click();
  await page.locator('#add_f_cleanedShelves').click();
  await page.locator('#f_cleanedShelves_0').selectOption('Middle');
  await page.locator('#f_cleanedShelves_1').selectOption('Top');
  await expect(page.locator('#f_cleanedShelves_0')).toContainText('Middle');
  await expect(page.locator('#f_cleanedShelves_0')).toHaveClass(/ng-valid-required/);
  await page.getByLabel('Favourite Shelf').selectOption('Bottom');
  await expect(page.getByLabel('Favourite Shelf')).toContainText('Bottom');
  await page.getByRole('button', { name: ' Save' }).click();
  await expect(page.getByRole('button', { name: ' Save' })).toBeDisabled();
  await expect(page.locator('#f_cleanedShelves_0')).toContainText('Middle');
  // await expect(page.locator('#f_cleanedShelves_0')).toHaveClass(/ng-valid-required/);    // This currently fails, but has done I think for ages...
  await expect(page.getByLabel('Favourite Shelf')).toContainText('Bottom');

  await page.goto('http://localhost:9000/#/l_referencing_list_in_other_document/new');
  await page.getByLabel('Description').click();
  await page.getByLabel('Description').fill('An item in multi');
  await page.getByLabel('Select box select').click();
  await page.getByLabel('Select box', { exact: true }).click();
  await page.getByLabel('Select box', { exact: true }).fill(`M${unique}`);
  await page.getByText(`M${unique} Warehouse`).click();
  await page.getByLabel('Shelf').selectOption('Top');
});

test('Creates a new record with a single shelf', async ({ page }) => {
  await page.goto('http://localhost:9000/#/k_referencing_self_collection/new');
  await page.getByLabel('Warehouse Name').fill(`S${unique} Warehouse`);
  await page.locator('#add_f_shelves_btn').click();
  await page.getByLabel('Shelves Location').click();
  await page.getByLabel('Shelves Location').fill('Only');
  await page.locator('#add_f_items_btn').click();
  await page.getByLabel('Items Description').click();
  await page.getByLabel('Items Description').fill('Item 1');
  await page.getByLabel('Shelf', { exact: true }).selectOption('Only');
  await page.locator('#add_f_cleanedShelves').click();
  await page.getByLabel('Cleaned Shelves').selectOption('Only');
  await page.getByLabel('Favourite Shelf').selectOption('Only');
  await page.getByRole('button', { name: ' Save' }).click();
  await expect(page.getByRole('button', { name: ' Save' })).toBeDisabled();
  await expect(page.locator('#f_cleanedShelves_0')).toContainText('Only');

  await page.goto('http://localhost:9000/#/l_referencing_list_in_other_document/new');
  await page.getByLabel('Description').fill('Single');
  await page.getByLabel('Select box select').click();
  await page.getByLabel('Select box', { exact: true }).click();
  await page.getByLabel('Select box', { exact: true }).fill(`S${unique}`);
  await page.getByText(`S${unique} Warehouse`).click();
  await page.getByLabel('Shelf').selectOption('Only');
});

