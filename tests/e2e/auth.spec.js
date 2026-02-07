import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('Register: Success Flow', async ({ page }) => {
        const username = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const password = 'Password123!';

        await page.goto('/register');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('http://127.0.0.1:4321/');
        await expect(
            page.locator('button:has-text("Logout"), a:has-text("Logout")').first(),
        ).toBeVisible();
    });

    test('Register: Fail on Short Password', async ({ page }) => {
        await page.goto('/register');
        await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.noValidate = true;
        });
        await page.fill('input[name="username"]', 'validuser');
        await page.fill('input[name="password"]', 'short');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });

    test('Register: Fail on Short Username', async ({ page }) => {
        await page.goto('/register');
        await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.noValidate = true;
        });
        await page.fill('input[name="username"]', 'usr');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Invalid username')).toBeVisible();
    });

    test('Register: Success with 4-char Username', async ({ page }) => {
        const username = `u${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`; 
        const password = 'Password123!';

        await page.goto('/register');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('http://127.0.0.1:4321/');
        await expect(
            page.locator('button:has-text("Logout"), a:has-text("Logout")').first(),
        ).toBeVisible();
    });

    test('Register: Fail on Invalid Username Chars', async ({ page }) => {
        await page.goto('/register');
        await page.fill('input[name="username"]', 'user name');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Invalid username')).toBeVisible();
    });

    test('Login: Success Flow (Admin)', async ({ page }) => {
        await page.goto('/');

        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);
        await expect(
            page.locator('button:has-text("Logout"), a:has-text("Logout")').first(),
        ).toBeVisible();
    });

    test('Login: Redirect Standard User to Homepage', async ({ page }) => {
        const username = `user_redirect_${Date.now()}`;
        const password = 'Password123!';

        await page.goto('/register');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('http://127.0.0.1:4321/');

        await page.click('button:has-text("Logout"), a:has-text("Logout")');
        await page.waitForURL('http://127.0.0.1:4321/');
        await expect(page.locator('text=Login')).toBeVisible();

        await page.goto('/login');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        await page.waitForURL('http://127.0.0.1:4321/');
        await expect(page).toHaveURL('http://127.0.0.1:4321/');
    });

    test('Login: Fail on Wrong Password', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'wrongpass');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Incorrect username or password')).toBeVisible();
    });

    test('Logout: Clears Session', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);
        await expect(
            page.locator('button:has-text("Logout"), a:has-text("Logout")').first(),
        ).toBeVisible();

        await page.click('button:has-text("Logout"), a:has-text("Logout")');
        await page.waitForURL('http://127.0.0.1:4321/');
        await expect(page.locator('text=Login')).toBeVisible();

        await page.goto('/admin');

        await page.waitForURL(/\/login/);
        expect(page.url()).toContain('/login');
    });
});
