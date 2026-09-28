import { type Page, type Locator, expect } from '@playwright/test';

// ─── Credentials ───────────────────────────────────────────────────────────
export const TEST_CREDENTIALS = {
  username: 'tazama-user@tazama.org',
  password: 'password',
} as const;

// ─── Routes ────────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  NETWORK_MAP: '/network-map',
  RULE: '/rule',
  TYPOLOGY: '/typology',
} as const;

// ─── Login helper ──────────────────────────────────────────────────────────

/**
 * Navigate to the login page, fill in credentials, and submit.
 * Waits for navigation to the dashboard.
 */
export async function login(page: Page): Promise<void> {
  await page.goto(ROUTES.LOGIN);
  await page.waitForLoadState('networkidle');

  // Fill email
  const emailInput = page.locator('#username');
  await emailInput.fill(TEST_CREDENTIALS.username);

  // Fill password
  const passwordInput = page.locator('#password');
  await passwordInput.fill(TEST_CREDENTIALS.password);

  // Click Login button
  const loginButton = page.getByRole('button', { name: 'Login' });
  await loginButton.click();

  // Wait for dashboard to load
  await page.waitForURL(`**${ROUTES.DASHBOARD}`, { timeout: 30_000 });
  await page.waitForLoadState('networkidle');
}

// ─── Navigation helpers ────────────────────────────────────────────────────

/**
 * Navigate to a specific section via the side-nav.
 * The side-nav items have aria-labels like "Navigate to Rule".
 */
export async function navigateTo(page: Page, label: string): Promise<void> {
  const navItem = page.getByRole('button', { name: `Navigate to ${label}` });
  await navItem.click();
  await page.waitForLoadState('networkidle');
}

// ─── Dialog helpers ────────────────────────────────────────────────────────

/**
 * Open the "Create New" dialog on a config page.
 */
export async function openCreateDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Create New' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

/**
 * Close any open dialog by clicking Cancel or Close.
 */
export async function closeDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const cancelButton = dialog.getByRole('button', { name: /^(Cancel|Close)$/ });
  await cancelButton.click();
  await expect(dialog).not.toBeVisible();
}

/**
 * Click the Save / Create button inside a dialog.
 */
export async function saveDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const saveButton = dialog.getByRole('button', { name: /^(Save|Create)$/ });
  await saveButton.click();
}

/**
 * Confirm deletion in the "Confirm Delete" dialog.
 */
export async function confirmDelete(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const deleteButton = dialog.getByRole('button', { name: 'Delete' });
  await deleteButton.click();
  await expect(dialog).not.toBeVisible();
}

// ─── Table helpers ─────────────────────────────────────────────────────────

/**
 * Find a row in the data-grid whose first cell contains the given text.
 * Returns the row locator.
 */
export function findRowByText(page: Page, text: string): Locator {
  return page.locator('.MuiDataGrid-row').filter({ hasText: text });
}

/**
 * Click the Edit (pencil) icon button within a specific row.
 */
async function clickRowAction(row: Locator, action: 'View' | 'Edit' | 'Delete'): Promise<void> {
  // The action buttons are inside tooltips; use the aria-label on the IconButton
  const button = row.getByRole('button', { name: action });
  await button.click();
}

export async function clickEditInRow(row: Locator): Promise<void> {
  await clickRowAction(row, 'Edit');
}

export async function clickViewInRow(row: Locator): Promise<void> {
  await clickRowAction(row, 'View');
}

export async function clickDeleteInRow(row: Locator): Promise<void> {
  await clickRowAction(row, 'Delete');
}

// ─── Misc helpers ──────────────────────────────────────────────────────────

/**
 * Wait for the loading spinner / Loader component to disappear.
 * The Loader renders a circular progress indicator.
 */
export async function waitForTableReady(page: Page): Promise<void> {
  // Wait for the data grid to be visible
  await expect(page.locator('.MuiDataGrid-root')).toBeVisible({ timeout: 20_000 });
  // Wait for any MUI CircularProgress to disappear
  await expect(page.locator('.MuiCircularProgress-root')).toHaveCount(0, { timeout: 20_000 });
}

/**
 * Generate a unique suffix based on the current timestamp.
 */
export function uniqueSuffix(): string {
  return Date.now().toString().slice(-6);
}
