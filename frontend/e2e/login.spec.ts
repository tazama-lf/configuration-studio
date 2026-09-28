import { test, expect } from '@playwright/test';
import { TEST_CREDENTIALS, ROUTES, login } from './helpers';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.LOGIN);
    await page.waitForLoadState('networkidle');
  });

  test('should display the login form with required fields', async ({ page }) => {
    // Title
    await expect(page.getByText('Tazama Config Studio')).toBeVisible();
    await expect(
      page.getByText('Please Enter Your Login Credentials To Access The Portal.'),
    ).toBeVisible();

    // Email and password fields
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Login button
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click login without filling anything
    await page.getByRole('button', { name: 'Login' }).click();

    // The form should show validation messages
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.locator('#username').fill('not-an-email');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.locator('#username').fill('user@example.com');
    await page.locator('#password').fill('12345'); // < 6 chars
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await passwordInput.fill('secretpass');

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye icon to show password
    const toggleButton = page.locator('#password').locator('..').getByRole('button');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.locator('#username').fill(TEST_CREDENTIALS.username);
    await page.locator('#password').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Should navigate to dashboard
    await page.waitForURL(`**${ROUTES.DASHBOARD}`, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard$/);

    // Auth token should be stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });

  test('should redirect to dashboard if already authenticated', async ({ page }) => {
    // First login
    await login(page);

    // Now try to visit login page again
    await page.goto(ROUTES.LOGIN);
    await page.waitForLoadState('networkidle');

    // Should redirect back to dashboard
    await page.waitForURL(`**${ROUTES.DASHBOARD}`, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.locator('#username').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show an error message (either inline or toast)
    await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible({
      timeout: 15_000,
    });

    // Should stay on login page
    await expect(page).toHaveURL(/\/login$/);
  });
});
