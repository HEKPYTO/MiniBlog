import { test, expect } from '@playwright/test';

const ownerPassword = 'password123';

async function login(page, username, password = ownerPassword) {
    await page.goto('/login');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    const isLoggedIn = await page
        .locator('button:has-text("Logout"), a:has-text("Logout")')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
    return isLoggedIn;
}

async function logout(page) {
    await page.click('button:has-text("Logout"), a:has-text("Logout")');
    await page.waitForURL('http://127.0.0.1:4321/');
}

test.describe.serial('RBAC: Comprehensive Security Checks', () => {
    const ownerUser = 'admin';

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('http://127.0.0.1:4321/');
        await context.close();
    });

    test('1. Owner Privileges: Full Access', async ({ page }) => {
        const success = await login(page, ownerUser);
        expect(success).toBe(true);

        await page.goto('http://127.0.0.1:4321/admin/users');
        await expect(page).toHaveURL('http://127.0.0.1:4321/admin/users');
        await expect(page.locator('h1')).toContainText('Site Management');

        await page.fill('input[name="q"]', '');
        await page.waitForLoadState('networkidle');

        const staffUser = `staff_${Date.now()}`;
        await page.fill('input[name="username"]', staffUser);
        await page.fill('input[name="password"]', 'Password123!');
        await page.selectOption('form[method="post"] select[name="role"]', 'admin');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('table')).toContainText(staffUser, { timeout: 10000 });

        const memberUser = `member_${Date.now()}`;
        await page.fill('input[name="username"]', memberUser);
        await page.fill('input[name="password"]', 'Password123!');
        await page.selectOption('form[method="post"] select[name="role"]', 'user');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('table')).toContainText(memberUser, { timeout: 10000 });
    });

    test('2. Admin (Staff) Restrictions', async ({ page }) => {
        await login(page, ownerUser);
        const staffName = `mod_${Date.now()}`;
        await page.goto('http://127.0.0.1:4321/admin/users');
        await page.fill('input[name="username"]', staffName);
        await page.fill('input[name="password"]', 'Password123!');
        await page.selectOption('form[method="post"] select[name="role"]', 'admin');
        await page.click('button:has-text("Create User")');
        await expect(page.locator('table')).toContainText(staffName);
        await logout(page);

        const staffLogin = await login(page, staffName, 'Password123!');
        expect(staffLogin).toBe(true);

        await page.goto('http://127.0.0.1:4321/admin');
        await expect(page).toHaveURL('http://127.0.0.1:4321/admin');
        await expect(page.locator('h1')).toContainText('Dashboard');

        await page.goto('http://127.0.0.1:4321/admin/users');
        await page.waitForURL(/\/admin$/);
        await expect(page).toHaveURL('http://127.0.0.1:4321/admin');
    });

    test('3. Member (User) Restrictions', async ({ page }) => {
        await login(page, ownerUser);
        const memberName = `peep_${Date.now()}`;
        await page.goto('http://127.0.0.1:4321/admin/users');
        await page.fill('input[name="username"]', memberName);
        await page.fill('input[name="password"]', 'Password123!');
        await page.selectOption('form[method="post"] select[name="role"]', 'user');
        await page.click('button:has-text("Create User")');
        await expect(page.locator('table')).toContainText(memberName);
        await logout(page);

        await login(page, memberName, 'Password123!');

        await page.goto('http://127.0.0.1:4321/admin');
        await page.waitForURL((url) => url.pathname === '/');
        await expect(page).toHaveURL('http://127.0.0.1:4321/');
    });

    test('4. Guest Restrictions', async ({ page }) => {
        await page.goto('http://127.0.0.1:4321/admin');
        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL('http://127.0.0.1:4321/login');
    });
});
