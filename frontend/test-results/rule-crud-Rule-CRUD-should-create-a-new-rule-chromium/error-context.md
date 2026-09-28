# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rule-crud.spec.ts >> Rule CRUD >> should create a new rule
- Location: e2e\rule-crud.spec.ts:26:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img "Logo" [ref=e8]
        - paragraph
      - button [ref=e9] [cursor=pointer]
  - main [ref=e10]:
    - generic [ref=e12]:
      - img "Logo" [ref=e14]
      - heading "Tazama Config Studio" [level=1] [ref=e15]
      - paragraph [ref=e16]: Please Enter Your Login Credentials To Access The Portal.
      - generic [ref=e17]:
        - generic [ref=e18]: Login failed. Please check your connection and try again.
        - generic [ref=e19]:
          - generic [ref=e20]:
            - text: Email Address
            - generic [ref=e21]: "*"
          - generic [ref=e22]:
            - img [ref=e24]
            - textbox "Email Address" [ref=e27]: tazama-user@tazama.org
            - group:
              - generic: Email Address *
        - generic [ref=e28]:
          - generic [ref=e29]:
            - text: Password
            - generic [ref=e30]: "*"
          - generic [ref=e31]:
            - img [ref=e33]
            - textbox "Password" [ref=e36]: password
            - button [ref=e38] [cursor=pointer]:
              - img [ref=e39]
            - group:
              - generic: Password *
        - button "Login" [active] [ref=e41] [cursor=pointer]:
          - img [ref=e42]
          - text: Login
      - paragraph [ref=e44]:
        - text: © 2026 LF Charities, Inc. and contributors to the Tazama project
        - text: Licensed under
        - link "Apache-2.0" [ref=e45] [cursor=pointer]:
          - /url: https://github.com/tazama-lf/config-studio/blob/main/LICENSE
    - img "Login visual" [ref=e47]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from '@playwright/test';
  2   | 
  3   | // ─── Credentials ───────────────────────────────────────────────────────────
  4   | export const TEST_CREDENTIALS = {
  5   |   username: 'tazama-user@tazama.org',
  6   |   password: 'password',
  7   | } as const;
  8   | 
  9   | // ─── Routes ────────────────────────────────────────────────────────────────
  10  | export const ROUTES = {
  11  |   LOGIN: '/login',
  12  |   DASHBOARD: '/dashboard',
  13  |   NETWORK_MAP: '/network-map',
  14  |   RULE: '/rule',
  15  |   TYPOLOGY: '/typology',
  16  | } as const;
  17  | 
  18  | // ─── Login helper ──────────────────────────────────────────────────────────
  19  | 
  20  | /**
  21  |  * Navigate to the login page, fill in credentials, and submit.
  22  |  * Waits for navigation to the dashboard.
  23  |  */
  24  | export async function login(page: Page): Promise<void> {
  25  |   await page.goto(ROUTES.LOGIN);
  26  |   await page.waitForLoadState('networkidle');
  27  | 
  28  |   // Fill email
  29  |   const emailInput = page.locator('#username');
  30  |   await emailInput.fill(TEST_CREDENTIALS.username);
  31  | 
  32  |   // Fill password
  33  |   const passwordInput = page.locator('#password');
  34  |   await passwordInput.fill(TEST_CREDENTIALS.password);
  35  | 
  36  |   // Click Login button
  37  |   const loginButton = page.getByRole('button', { name: 'Login' });
  38  |   await loginButton.click();
  39  | 
  40  |   // Wait for dashboard to load
> 41  |   await page.waitForURL(`**${ROUTES.DASHBOARD}`, { timeout: 30_000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  42  |   await page.waitForLoadState('networkidle');
  43  | }
  44  | 
  45  | // ─── Navigation helpers ────────────────────────────────────────────────────
  46  | 
  47  | /**
  48  |  * Navigate to a specific section via the side-nav.
  49  |  * The side-nav items have aria-labels like "Navigate to Rule".
  50  |  */
  51  | export async function navigateTo(page: Page, label: string): Promise<void> {
  52  |   const navItem = page.getByRole('button', { name: `Navigate to ${label}` });
  53  |   await navItem.click();
  54  |   await page.waitForLoadState('networkidle');
  55  | }
  56  | 
  57  | // ─── Dialog helpers ────────────────────────────────────────────────────────
  58  | 
  59  | /**
  60  |  * Open the "Create New" dialog on a config page.
  61  |  */
  62  | export async function openCreateDialog(page: Page): Promise<void> {
  63  |   await page.getByRole('button', { name: 'Create New' }).click();
  64  |   await expect(page.getByRole('dialog')).toBeVisible();
  65  | }
  66  | 
  67  | /**
  68  |  * Close any open dialog by clicking Cancel or Close.
  69  |  */
  70  | export async function closeDialog(page: Page): Promise<void> {
  71  |   const dialog = page.getByRole('dialog');
  72  |   const cancelButton = dialog.getByRole('button', { name: /^(Cancel|Close)$/ });
  73  |   await cancelButton.click();
  74  |   await expect(dialog).not.toBeVisible();
  75  | }
  76  | 
  77  | /**
  78  |  * Click the Save / Create button inside a dialog.
  79  |  */
  80  | export async function saveDialog(page: Page): Promise<void> {
  81  |   const dialog = page.getByRole('dialog');
  82  |   const saveButton = dialog.getByRole('button', { name: /^(Save|Create)$/ });
  83  |   await saveButton.click();
  84  | }
  85  | 
  86  | /**
  87  |  * Confirm deletion in the "Confirm Delete" dialog.
  88  |  */
  89  | export async function confirmDelete(page: Page): Promise<void> {
  90  |   const dialog = page.getByRole('dialog');
  91  |   const deleteButton = dialog.getByRole('button', { name: 'Delete' });
  92  |   await deleteButton.click();
  93  |   await expect(dialog).not.toBeVisible();
  94  | }
  95  | 
  96  | // ─── Table helpers ─────────────────────────────────────────────────────────
  97  | 
  98  | /**
  99  |  * Find a row in the data-grid whose first cell contains the given text.
  100 |  * Returns the row locator.
  101 |  */
  102 | export function findRowByText(page: Page, text: string): Locator {
  103 |   return page.locator('.MuiDataGrid-row').filter({ hasText: text });
  104 | }
  105 | 
  106 | /**
  107 |  * Click the Edit (pencil) icon button within a specific row.
  108 |  */
  109 | async function clickRowAction(row: Locator, action: 'View' | 'Edit' | 'Delete'): Promise<void> {
  110 |   // The action buttons are inside tooltips; use the aria-label on the IconButton
  111 |   const button = row.getByRole('button', { name: action });
  112 |   await button.click();
  113 | }
  114 | 
  115 | export async function clickEditInRow(row: Locator): Promise<void> {
  116 |   await clickRowAction(row, 'Edit');
  117 | }
  118 | 
  119 | export async function clickViewInRow(row: Locator): Promise<void> {
  120 |   await clickRowAction(row, 'View');
  121 | }
  122 | 
  123 | export async function clickDeleteInRow(row: Locator): Promise<void> {
  124 |   await clickRowAction(row, 'Delete');
  125 | }
  126 | 
  127 | // ─── Misc helpers ──────────────────────────────────────────────────────────
  128 | 
  129 | /**
  130 |  * Wait for the loading spinner / Loader component to disappear.
  131 |  * The Loader renders a circular progress indicator.
  132 |  */
  133 | export async function waitForTableReady(page: Page): Promise<void> {
  134 |   // Wait for the data grid to be visible
  135 |   await expect(page.locator('.MuiDataGrid-root')).toBeVisible({ timeout: 20_000 });
  136 |   // Wait for any MUI CircularProgress to disappear
  137 |   await expect(page.locator('.MuiCircularProgress-root')).toHaveCount(0, { timeout: 20_000 });
  138 | }
  139 | 
  140 | /**
  141 |  * Generate a unique suffix based on the current timestamp.
```