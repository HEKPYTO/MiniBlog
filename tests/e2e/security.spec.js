import { test, expect } from '@playwright/test';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

async function login(page, username = 'admin', password = 'password123') {
    await page.goto('/login');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    await expect(
        page.locator('button:has-text("Logout"), a:has-text("Logout")').first(),
    ).toBeVisible();
}

test.describe('Security Audits', () => {
    test('XSS: Script in Body', async ({ page }) => {
        await login(page);

        await page.goto('/admin/editor');
        const xss = '<script>alert(1)</script>';
        await page.fill('input[name="title"]', `XSS Body ${Date.now()}`);
        await page.fill('textarea[name="content"]', xss);
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/');
        await page.click('text=XSS Body');
        const content = await page.content();
        expect(content).not.toContain('<script>alert(1)</script>');
    });

    test('XSS: Script in Title', async ({ page }) => {
        await login(page);

        await page.goto('/admin/editor');
        const xssTitle = '<script>alert("Title")</script>';
        await page.fill('input[name="title"]', xssTitle);
        await page.fill('textarea[name="content"]', 'Content');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/');
        const content = await page.content();
        expect(content).not.toContain('<script>alert("Title")</script>');
    });

    test('Access Control: Admin Route Protection', async ({ page }) => {
        await page.goto('/admin');
        await page.waitForURL(/\/login/);
        expect(page.url()).toContain('/login');

        const user = `user_${Date.now()}`;
        await page.goto('/register');
        await page.fill('input[name="username"]', user);
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://127.0.0.1:4321/');

        await db.update(users).set({ role: 'user' }).where(eq(users.username, user));

        await page.goto('/admin');
        await page.waitForURL('http://127.0.0.1:4321/');
        expect(page.url()).not.toContain('/admin');
    });

    test('Access Control: Owner Route Protection (Admin vs Owner)', async ({ page }) => {
        await login(page, 'admin');

        const newAdmin = `admin_${Date.now()}`;
        await page.goto('/admin/users');
        await page.fill('input[name="username"]', newAdmin);
        await page.fill('input[name="password"]', 'Password123!');
        await page.selectOption('form[method="post"] select[name="role"]', 'admin');
        await page.click('button:has-text("Create User")');
        await page.waitForSelector(`text=${newAdmin}`);

        await page.click('button:has-text("Logout"), a:has-text("Logout")');
        await page.waitForURL('http://127.0.0.1:4321/');

        await login(page, newAdmin, 'Password123!');
        await page.goto('/admin/users');
        await page.waitForURL(/\/admin$/);
        expect(page.url()).toContain('/admin');
        expect(page.url()).not.toContain('/users');
    });

    test('Auth: SQL Injection attempt in login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', "' OR '1'='1");
        await page.fill('input[name="password"]', "' OR '1'='1");
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Incorrect username or password')).toBeVisible();
    });

    test('Access Control: IDOR prevention on User Management', async ({ page }) => {
        const attacker = `attacker_${Date.now()}`;
        await page.goto('/register');
        await page.fill('input[name="username"]', attacker);
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://127.0.0.1:4321/');

        await db.update(users).set({ role: 'user' }).where(eq(users.username, attacker));

        const response = await page.request.post('/admin/users', {
            form: {
                action: 'delete',
                target_id: 'some_id',
            },
            headers: {
                Origin: 'http://127.0.0.1:4321',
            },
        });

        const finalUrl = response.url();
        expect(finalUrl).not.toContain('/admin/users');
    });
});
