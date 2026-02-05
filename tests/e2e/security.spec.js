import { test, expect } from '@playwright/test';

async function login(page) {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);
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
        await page.waitForLoadState('domcontentloaded');

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
        await page.fill('input[name="date"]', '01/01/2026');
        await page.fill('input[name="time"]', '12:00');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")', { force: true });
        await expect(page).toHaveURL(/id=/);
        await page.waitForLoadState('domcontentloaded');

        await page.goto('/');
        const content = await page.content();
        expect(content).not.toContain('<script>alert("Title")</script>');
    });

    test('Access Control: Admin Route Protection', async ({ page }) => {
        await page.goto('/admin');
        expect(page.url()).not.toContain('/admin');

        const user = `user_${Date.now()}`;
        await page.goto('/register');
        await page.fill('input[name="username"]', user);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        await page.goto('/admin');
        expect(page.url()).not.toContain('/admin');

        await page.goto('/admin/editor');
        expect(page.url()).not.toContain('/editor');

        await page.goto('/admin/users');
        expect(page.url()).not.toContain('/users');
    });

    test('Access Control: Owner Route Protection (Admin vs Owner)', async ({ page }) => {
        await login(page);

        const newAdmin = `admin_${Date.now()}`;
        await page.goto('/admin/users');
        await page.fill('input[name="username"]', newAdmin);
        await page.fill('input[name="password"]', 'password123');
        await page.locator('form[method="post"] select[name="role"]').selectOption('admin');
        await page.click('button:has-text("Create User")');
        await page.click('text=Logout');
        await expect(page).toHaveURL('/');

        await page.goto('/login');
        await page.fill('input[name="username"]', newAdmin);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/users');
        expect(page.url()).not.toContain('/admin/users');
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
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        const response = await page.request.post('/admin/users', {
            data: {
                action: 'delete',
                target_id: 'some_id',
            },
        });

        expect(response.status()).toBe(403);
    });
});
