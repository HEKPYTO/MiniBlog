import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
    async function setupOwner(page) {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);

        return 'admin';
    }

    test('Badge: Variants render correctly', async ({ page }) => {
        await setupOwner(page);
        await page.goto('http://127.0.0.1:4321/admin/users');

        const row = page.locator('tr', { hasText: '(You)' });

        await expect(row).toBeVisible();

        const badge = row.locator('td').nth(1).locator('div');

        await expect(badge).toBeVisible();

        await expect(badge).toHaveClass(/bg-red-500/);
    });

    test('Button: Variants and States', async ({ page }) => {
        await setupOwner(page);
        await page.goto('http://127.0.0.1:4321/admin/users');

        const createBtn = page.locator('button:has-text("Create User")');
        await expect(createBtn).toHaveClass(/bg-slate-900/);

        const backBtn = page.locator('a[href="/admin"] button:has-text("Back")');
        await expect(backBtn).toHaveClass(/border-slate-200/);

        const logoutBtn = page.locator('form[action="/api/logout"] button');
        await expect(logoutBtn).toHaveClass(/hover:bg-slate-100/);
    });
});
