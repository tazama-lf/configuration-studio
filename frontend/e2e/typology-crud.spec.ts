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

test.describe('Typology CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Typology');
    await waitForTableReady(page);
  });

  // ─── Create ─────────────────────────────────────────────────────────────

  test('should create a new typology', async ({ page }) => {
    const suffix = uniqueSuffix();
    const typologyId = `900-${suffix}`;
    const cfgVersion = `1.0.0`;
    const description = `Playwright Test Typology ${suffix}`;

    await openCreateDialog(page);

    // Verify dialog title
    await expect(page.getByRole('heading', { name: 'Create Typology' })).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Fill in ID and Config Version (they are side-by-side)
    await dialog.getByLabel('ID').fill(typologyId);
    await dialog.getByLabel('Config Version').fill(cfgVersion);
    await dialog.getByLabel('Description').fill(description);

    // Set workflow alert threshold
    const alertThresholdField = dialog.getByLabel('Alert Threshold');
    if (await alertThresholdField.isVisible()) {
      await alertThresholdField.fill('50');
    }

    // Save
    await saveDialog(page);

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Wait for table to refresh
    await waitForTableReady(page);

    // The new typology should appear in the table
    const row = findRowByText(page, description);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });

  // ─── Read ───────────────────────────────────────────────────────────────

  test('should view an existing typology', async ({ page }) => {
    // Wait for at least one row in the table
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Click the View icon on the first row
    await clickViewInRow(firstRow);

    // View dialog should open
    await expect(page.getByRole('heading', { name: 'View Typology' })).toBeVisible();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close the dialog
    await closeDialog(page);
  });

  // ─── Update ─────────────────────────────────────────────────────────────

  test('should edit an existing typology description', async ({ page }) => {
    // Wait for at least one row
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Click Edit on the first row
    await clickEditInRow(firstRow);

    // Edit dialog should open
    await expect(page.getByRole('heading', { name: 'Edit Typology' })).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Update the description field
    const descField = dialog.getByLabel('Description');
    await descField.fill(`Updated Typology by Playwright ${uniqueSuffix()}`);

    // Save
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Wait for table to refresh
    await waitForTableReady(page);
  });

  // ─── Delete ─────────────────────────────────────────────────────────────

  test('should delete a typology', async ({ page }) => {
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
    const idMatch = rowText.match(/(\S+)/);
    if (idMatch) {
      const deletedId = idMatch[1];
      await expect(findRowByText(page, deletedId)).not.toBeVisible({ timeout: 10_000 });
    }
  });

  // ─── Full CRUD cycle ────────────────────────────────────────────────────

  test('should perform full CRUD lifecycle on a typology', async ({ page }) => {
    const suffix = uniqueSuffix();
    const typologyId = `888-${suffix}`;
    const cfgVersion = `3.0.0`;
    const description = `CRUD Lifecycle Typology ${suffix}`;
    const updatedDescription = `Updated CRUD Typology ${suffix}`;

    // ── Create ──
    await openCreateDialog(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('ID').fill(typologyId);
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
    await expect(page.getByRole('heading', { name: 'Edit Typology' })).toBeVisible();
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
