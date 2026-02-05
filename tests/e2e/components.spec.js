import { test, expect } from '@playwright/test';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { generateId } from 'lucia';
import { Bcrypt } from 'oslo/password';

test.describe('UI Components', () => {
    async function setupOwner(page) {
        const username = `comp_owner_${Date.now()}`;
        const password = 'password123';
        const passwordHash = await new Bcrypt().hash(password);

        await db.insert(users).values({
            id: generateId(15),
            username,
            password_hash: passwordHash,
            role: 'owner',
            createdAt: Date.now(),
        });

        await page.goto('/login');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/admin/);

        return username;
    }

    test('Badge: Variants render correctly', async ({ page }) => {
        const username = await setupOwner(page);
        await page.goto('/admin/users');

        const row = page.locator('tr', { hasText: username });

        await expect(row).toBeVisible();

        const badge = row.locator('td').nth(1).locator('div');

        await expect(badge).toBeVisible();

        await expect(badge).toHaveClass(/bg-red-500/);
    });

    test('Button: Variants and States', async ({ page }) => {
        await setupOwner(page);
        await page.goto('/admin/users');

        const createBtn = page.locator('button:has-text("Create User")');
        await expect(createBtn).toHaveClass(/bg-slate-900/);

        const backBtn = page.locator('a[href="/admin"] button:has-text("Back")');
        await expect(backBtn).toHaveClass(/border-slate-200/);

        const logoutBtn = page.locator('form[action="/api/logout"] button');
        await expect(logoutBtn).toHaveClass(/hover:bg-slate-100/);
    });
});
