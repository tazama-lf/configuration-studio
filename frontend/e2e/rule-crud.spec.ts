import { test, expect } from '@playwright/test';
import {
  login,
  navigateTo,
  openCreateDialog,
  saveDialog,
  closeDialog,
  confirmDelete,
  findRowByText,
  clickEditInRow,
  clickViewInRow,
  clickDeleteInRow,
  waitForTableReady,
  uniqueSuffix,
} from './helpers';

test.describe('Rule CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Rule');
    await waitForTableReady(page);
  });

  // ─── Create ─────────────────────────────────────────────────────────────

  test('should create a new rule', async ({ page }) => {
    const suffix = uniqueSuffix();
    const ruleId = `901@1.0.0-${suffix}`;
    const cfgVersion = `1.0.0`;
    const description = `Playwright Test Rule ${suffix}`;

    await openCreateDialog(page);

    // Verify dialog title
    await expect(page.getByRole('heading', { name: 'Create Rule' })).toBeVisible();

    // Fill in the form
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('ID').fill(ruleId);
    await dialog.getByLabel('Config Version').fill(cfgVersion);
    await dialog.getByLabel('Description').fill(description);

    // Add a parameter
    await dialog.getByRole('button', { name: 'Add Parameter' }).click();
    // Select the first parameter key from the dropdown
    await dialog.locator('.MuiSelect-select').first().click();
    await page.getByRole('option', { name: 'maxQueryRange' }).click();
    await dialog.getByLabel('Value').fill('100');

    // Add an exit condition
    await dialog.getByRole('button', { name: 'Add Exit Condition' }).click();
    const subRuleInputs = dialog.getByLabel('Sub Rule Ref');
    await subRuleInputs.first().fill('.x00');
    const reasonInputs = dialog.getByLabel('Reason');
    await reasonInputs.first().fill('Test exit reason');

    // Add a band
    await dialog.getByRole('button', { name: 'Add Band' }).click();
    const bandSubRuleInputs = dialog.getByLabel('Sub Rule Ref');
    await bandSubRuleInputs.nth(1).fill('.001');
    const bandReasonInputs = dialog.getByLabel('Reason');
    await bandReasonInputs.nth(1).fill('Test band reason');
    const lowerLimitInputs = dialog.getByLabel('Lower Limit');
    await lowerLimitInputs.first().fill('0');
    const upperLimitInputs = dialog.getByLabel('Upper Limit');
    await upperLimitInputs.first().fill('1000');

    // Save
    await saveDialog(page);

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Wait for table to refresh
    await waitForTableReady(page);

    // The new rule should appear in the table
    const row = findRowByText(page, description);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });

  // ─── Read ───────────────────────────────────────────────────────────────

  test('should view an existing rule', async ({ page }) => {
    // Wait for at least one row in the table
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Click the View icon on the first row
    await clickViewInRow(firstRow);

    // View dialog should open
    await expect(page.getByRole('heading', { name: 'View Rule' })).toBeVisible();

    // The dialog should contain read-only fields
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close the dialog
    await closeDialog(page);
  });

  // ─── Update ─────────────────────────────────────────────────────────────

  test('should edit an existing rule description', async ({ page }) => {
    // Wait for at least one row
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Click Edit on the first row
    await clickEditInRow(firstRow);

    // Edit dialog should open
    await expect(page.getByRole('heading', { name: 'Edit Rule' })).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Update the description field
    const descField = dialog.getByLabel('Description');
    await descField.fill(`Updated by Playwright ${uniqueSuffix()}`);

    // Save
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Wait for table to refresh
    await waitForTableReady(page);
  });

  // ─── Delete ─────────────────────────────────────────────────────────────

  test('should delete a rule', async ({ page }) => {
    // Wait for at least one row
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Capture the row text for later verification
    const rowText = await firstRow.innerText();

    // Click Delete on the first row
    await clickDeleteInRow(firstRow);

    // Confirm Delete dialog should appear
    await expect(page.getByRole('heading', { name: 'Confirm Delete' })).toBeVisible();

    // Confirm deletion
    await confirmDelete(page);

    // Wait for table to refresh
    await waitForTableReady(page);

    // The deleted row should no longer be present
    // Use a portion of the row text that's unique enough
    const idMatch = rowText.match(/(\S+)/);
    if (idMatch) {
      const deletedId = idMatch[1];
      await expect(findRowByText(page, deletedId)).not.toBeVisible({ timeout: 10_000 });
    }
  });

  // ─── Full CRUD cycle ────────────────────────────────────────────────────

  test('should perform full CRUD lifecycle on a rule', async ({ page }) => {
    const suffix = uniqueSuffix();
    const ruleId = `999@2.0.0-${suffix}`;
    const cfgVersion = `2.0.0`;
    const description = `CRUD Lifecycle Rule ${suffix}`;
    const updatedDescription = `Updated CRUD Lifecycle ${suffix}`;

    // ── Create ──
    await openCreateDialog(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('ID').fill(ruleId);
    await dialog.getByLabel('Config Version').fill(cfgVersion);
    await dialog.getByLabel('Description').fill(description);
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // ── Read: verify it appears ──
    let row = findRowByText(page, description);
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ── Update: edit the description ──
    await clickEditInRow(row);
    await expect(page.getByRole('heading', { name: 'Edit Rule' })).toBeVisible();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Description').fill(updatedDescription);
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify updated description appears
    row = findRowByText(page, updatedDescription);
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ── Delete ──
    await clickDeleteInRow(row);
    await expect(page.getByRole('heading', { name: 'Confirm Delete' })).toBeVisible();
    await confirmDelete(page);
    await waitForTableReady(page);

    // Verify it's gone
    await expect(findRowByText(page, updatedDescription)).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
