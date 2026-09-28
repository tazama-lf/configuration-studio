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

test.describe('Network Map CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Network Map');
    await waitForTableReady(page);
  });

  // ─── Create ─────────────────────────────────────────────────────────────

  test('should create a new network map', async ({ page }) => {
    const suffix = uniqueSuffix();
    const cfgVersion = `${suffix}.0.0`;

    await openCreateDialog(page);

    // Verify dialog title
    await expect(page.getByRole('heading', { name: 'Create Network Map' })).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Fill in Config Version
    await dialog.getByLabel('Config Version').fill(cfgVersion);

    // The Active switch should be present and checked by default
    const activeSwitch = dialog.getByRole('checkbox', { name: /active/i });
    if (await activeSwitch.isVisible()) {
      // Ensure it's checked
      await expect(activeSwitch).toBeChecked();
    }

    // Save — an empty messages array is valid
    await saveDialog(page);

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Wait for table to refresh
    await waitForTableReady(page);

    // The new network map should appear in the table
    const row = findRowByText(page, cfgVersion);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });

  // ─── Read ───────────────────────────────────────────────────────────────

  test('should view an existing network map', async ({ page }) => {
    // Wait for at least one row in the table
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Click the View icon on the first row
    await clickViewInRow(firstRow);

    // View dialog should open
    await expect(page.getByRole('heading', { name: 'View Network Map' })).toBeVisible();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close the dialog
    await closeDialog(page);
  });

  // ─── Update ─────────────────────────────────────────────────────────────

  test('should edit an existing network map (toggle active)', async ({ page }) => {
    // Wait for at least one row
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // Click Edit on the first row
    await clickEditInRow(firstRow);

    // Edit dialog should open
    await expect(page.getByRole('heading', { name: 'Edit Network Map' })).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Toggle the Active switch
    const activeSwitch = dialog.getByRole('checkbox', { name: /active/i });
    if (await activeSwitch.isVisible()) {
      await activeSwitch.click();
    }

    // Save
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Wait for table to refresh
    await waitForTableReady(page);
  });

  // ─── Delete ─────────────────────────────────────────────────────────────

  test('should delete a network map', async ({ page }) => {
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
    // Extract the config version from the row text
    const cfgMatch = rowText.match(/(\d+\.\d+\.\d+)/);
    if (cfgMatch) {
      const deletedCfg = cfgMatch[1];
      await expect(findRowByText(page, deletedCfg)).not.toBeVisible({ timeout: 10_000 });
    }
  });

  // ─── Full CRUD cycle ────────────────────────────────────────────────────

  test('should perform full CRUD lifecycle on a network map', async ({ page }) => {
    const suffix = uniqueSuffix();
    const cfgVersion = `${suffix}.1.0`;

    // ── Create ──
    await openCreateDialog(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Config Version').fill(cfgVersion);
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // ── Read: verify it appears ──
    let row = findRowByText(page, cfgVersion);
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ── Update: toggle active state ──
    await clickEditInRow(row);
    await expect(page.getByRole('heading', { name: 'Edit Network Map' })).toBeVisible();
    const editDialog = page.getByRole('dialog');
    const activeSwitch = editDialog.getByRole('checkbox', { name: /active/i });
    if (await activeSwitch.isVisible()) {
      await activeSwitch.click();
    }
    await saveDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify the row still exists after update
    row = findRowByText(page, cfgVersion);
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ── Delete ──
    await clickDeleteInRow(row);
    await expect(page.getByRole('heading', { name: 'Confirm Delete' })).toBeVisible();
    await confirmDelete(page);
    await waitForTableReady(page);

    // Verify it's gone
    await expect(findRowByText(page, cfgVersion)).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
