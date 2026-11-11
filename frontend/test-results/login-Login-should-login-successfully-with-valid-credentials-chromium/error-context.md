# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login >> should login successfully with valid credentials
- Location: e2e\login.spec.ts:66:3

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
  1   | import { test, expect } from '@playwright/test';
  2   | import { TEST_CREDENTIALS, ROUTES, login } from './helpers';
  3   | 
  4   | test.describe('Login', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto(ROUTES.LOGIN);
  7   |     await page.waitForLoadState('networkidle');
  8   |   });
  9   | 
  10  |   test('should display the login form with required fields', async ({ page }) => {
  11  |     // Title
  12  |     await expect(page.getByText('Tazama Config Studio')).toBeVisible();
  13  |     await expect(
  14  |       page.getByText('Please Enter Your Login Credentials To Access The Portal.'),
  15  |     ).toBeVisible();
  16  | 
  17  |     // Email and password fields
  18  |     await expect(page.locator('#username')).toBeVisible();
  19  |     await expect(page.locator('#password')).toBeVisible();
  20  | 
  21  |     // Login button
  22  |     await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  23  |   });
  24  | 
  25  |   test('should show validation errors for empty fields', async ({ page }) => {
  26  |     // Click login without filling anything
  27  |     await page.getByRole('button', { name: 'Login' }).click();
  28  | 
  29  |     // The form should show validation messages
  30  |     await expect(page.getByText(/required/i)).toBeVisible();
  31  |   });
  32  | 
  33  |   test('should show validation error for invalid email format', async ({ page }) => {
  34  |     await page.locator('#username').fill('not-an-email');
  35  |     await page.locator('#password').fill('password123');
  36  |     await page.getByRole('button', { name: 'Login' }).click();
  37  | 
  38  |     await expect(page.getByText(/valid email/i)).toBeVisible();
  39  |   });
  40  | 
  41  |   test('should show validation error for short password', async ({ page }) => {
  42  |     await page.locator('#username').fill('user@example.com');
  43  |     await page.locator('#password').fill('12345'); // < 6 chars
  44  |     await page.getByRole('button', { name: 'Login' }).click();
  45  | 
  46  |     await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  47  |   });
  48  | 
  49  |   test('should toggle password visibility', async ({ page }) => {
  50  |     const passwordInput = page.locator('#password');
  51  |     await passwordInput.fill('secretpass');
  52  | 
  53  |     // Initially password is hidden
  54  |     await expect(passwordInput).toHaveAttribute('type', 'password');
  55  | 
  56  |     // Click the eye icon to show password
  57  |     const toggleButton = page.locator('#password').locator('..').getByRole('button');
  58  |     await toggleButton.click();
  59  |     await expect(passwordInput).toHaveAttribute('type', 'text');
  60  | 
  61  |     // Click again to hide
  62  |     await toggleButton.click();
  63  |     await expect(passwordInput).toHaveAttribute('type', 'password');
  64  |   });
  65  | 
  66  |   test('should login successfully with valid credentials', async ({ page }) => {
  67  |     await page.locator('#username').fill(TEST_CREDENTIALS.username);
  68  |     await page.locator('#password').fill(TEST_CREDENTIALS.password);
  69  |     await page.getByRole('button', { name: 'Login' }).click();
  70  | 
  71  |     // Should navigate to dashboard
> 72  |     await page.waitForURL(`**${ROUTES.DASHBOARD}`, { timeout: 30_000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  73  |     await expect(page).toHaveURL(/\/dashboard$/);
  74  | 
  75  |     // Auth token should be stored in localStorage
  76  |     const token = await page.evaluate(() => localStorage.getItem('authToken'));
  77  |     expect(token).toBeTruthy();
  78  |   });
  79  | 
  80  |   test('should redirect to dashboard if already authenticated', async ({ page }) => {
  81  |     // First login
  82  |     await login(page);
  83  | 
  84  |     // Now try to visit login page again
  85  |     await page.goto(ROUTES.LOGIN);
  86  |     await page.waitForLoadState('networkidle');
  87  | 
  88  |     // Should redirect back to dashboard
  89  |     await page.waitForURL(`**${ROUTES.DASHBOARD}`, { timeout: 15_000 });
  90  |     await expect(page).toHaveURL(/\/dashboard$/);
  91  |   });
  92  | 
  93  |   test('should show error for invalid credentials', async ({ page }) => {
  94  |     await page.locator('#username').fill('wrong@example.com');
  95  |     await page.locator('#password').fill('wrongpassword');
  96  |     await page.getByRole('button', { name: 'Login' }).click();
  97  | 
  98  |     // Should show an error message (either inline or toast)
  99  |     await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible({
  100 |       timeout: 15_000,
  101 |     });
  102 | 
  103 |     // Should stay on login page
  104 |     await expect(page).toHaveURL(/\/login$/);
  105 |   });
  106 | });
  107 | 
```