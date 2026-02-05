import { test, expect } from '@playwright/test';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { generateId } from 'lucia';
import { Bcrypt } from 'oslo/password';

test.describe('Authentication', () => {
    test('Register: Success Flow', async ({ page }) => {
        const username = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const password = 'password123';

        await page.goto('/register');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Logout')).toBeVisible();
    });

    test('Register: Fail on Short Password', async ({ page }) => {
        await page.goto('/register');
        await page.evaluate(() => (document.querySelector('form').noValidate = true));
        await page.fill('input[name="username"]', 'validuser');
        await page.fill('input[name="password"]', 'short');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });

    test('Register: Fail on Invalid Username Chars', async ({ page }) => {
        await page.goto('/register');
        await page.fill('input[name="username"]', 'user name');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Invalid username')).toBeVisible();
    });

    test('Login: Success Flow (Admin)', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('text=Logout')).toBeVisible();
    });

    test('Login: Redirect Standard User to Homepage', async ({ page }) => {
        const username = `user_redirect_${Date.now()}`;
        const password = 'password123!';
        const passwordHash = await new Bcrypt().hash(password);

        await db.insert(users).values({
            id: generateId(15),
            username: username,
            password_hash: passwordHash,
            role: 'user',
            createdAt: Date.now(),
        });

        await page.goto('/login');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/http:\/\/[^/]+\/$/);
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
        await expect(page.locator('text=Logout')).toBeVisible();

        await page.click('text=Logout');
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Login')).toBeVisible();

        const response = await page.goto('/admin');
        expect(response.url()).toMatch(new RegExp('http://(localhost|127\\.0\\.0\\.1):4321/'));
    });
});
