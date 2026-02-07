import { test, expect } from '@playwright/test';

async function login(page, username = 'admin', password = 'password123') {
    await page.goto('/login');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    await expect(page).toHaveURL(/\/admin/);
}

test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Dashboard: Initial State', async ({ page }) => {
        await page.goto('/admin');
        await expect(page.locator('h1')).toContainText('Dashboard');
        await expect(page.locator('th', { hasText: 'Title' })).toBeVisible();
    });

    test('Dashboard: Search Filter (Title)', async ({ page }) => {
        const uniqueTitle = `SearchTarget_${Date.now()}`;
        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', uniqueTitle);
        await page.fill('textarea[name="content"]', 'Content');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin');
        const input = page.locator('main input[name="q"]');
        await input.fill(uniqueTitle);
        await page.waitForURL(new RegExp(`q=${uniqueTitle}`));

        await expect(page.locator('tbody tr').first()).toContainText(uniqueTitle);

        await input.fill('NonExistentThing');
        await input.press('Enter');
        await page.waitForURL(/q=NonExistentThing/);

        await expect(input).toHaveValue('NonExistentThing');

        await expect(page.locator('tbody')).not.toContainText(uniqueTitle);
    });

    test('Dashboard: Search Filter (Tags)', async ({ page }) => {
        const uniqueTag = `tag${Date.now()}`;
        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', `TagPost_${Date.now()}`);
        await page.fill('textarea[name="content"]', 'Content');
        await page.fill('input[name="tags"]', uniqueTag);
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin');
        const input = page.locator('main input[name="q"]');
        await input.fill(uniqueTag);
        await page.waitForURL(new RegExp(`q=${uniqueTag}`));

        const rows = await page.locator('tbody tr').count();
        expect(rows).toBeGreaterThan(0);
    });

    test('Dashboard: Sorting (Status)', async ({ page }) => {
        await page.goto('/admin');

        await page.click('a:has-text("Status")');
        await page.waitForURL(/sort=status&order=desc/);

        await page.click('a:has-text("Status")');
        await page.waitForURL(/sort=status&order=asc/);
    });

    test('Dashboard: Sorting (Date)', async ({ page }) => {
        await page.goto('/admin');
        const oldTitle = `Old_${Date.now()}`;
        const newTitle = `New_${Date.now()}`;

        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', oldTitle);
        await page.fill('textarea[name="content"]', 'Old');
        await page.fill('input[name="date"]', '01/01/2000');
        await page.fill('input[name="time"]', '12:00');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', newTitle);
        await page.fill('textarea[name="content"]', 'New');
        const randomMinute = Math.floor(Math.random() * 60)
            .toString()
            .padStart(2, '0');
        await page.fill('input[name="date"]', '01/01/2050');
        await page.fill('input[name="time"]', `12:${randomMinute}`);
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin');

        await page.click('a:has-text("Date")');
        await page.waitForURL(/sort=publishedAt&order=desc/);
        await page.waitForLoadState('networkidle');
        const rows = page.locator('tbody tr');
        const newIdx = await rows.evaluateAll(
            (trs, title) => trs.findIndex((tr) => tr.textContent.includes(title)),
            newTitle,
        );
        const oldIdx = await rows.evaluateAll(
            (trs, title) => trs.findIndex((tr) => tr.textContent.includes(title)),
            oldTitle,
        );
        expect(newIdx).toBeGreaterThanOrEqual(0);
        expect(oldIdx).toBeGreaterThanOrEqual(0);
        expect(newIdx).toBeLessThan(oldIdx);

        await page.click('a:has-text("Date")');
        await page.waitForURL(/sort=publishedAt&order=asc/);
        await page.waitForLoadState('networkidle');
        const newIdxAsc = await rows.evaluateAll(
            (trs, title) => trs.findIndex((tr) => tr.textContent.includes(title)),
            newTitle,
        );
        const oldIdxAsc = await rows.evaluateAll(
            (trs, title) => trs.findIndex((tr) => tr.textContent.includes(title)),
            oldTitle,
        );
        expect(newIdxAsc).toBeGreaterThanOrEqual(0);
        expect(oldIdxAsc).toBeGreaterThanOrEqual(0);
        expect(oldIdxAsc).toBeLessThan(newIdxAsc);
    });
});

test.describe('Site Settings', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Settings: Page shows Site Management heading', async ({ page }) => {
        await page.goto('/admin/users');
        await expect(page.locator('h1')).toContainText('Site Management');
        await expect(page.locator('h2', { hasText: 'Site Settings' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Users' })).toBeVisible();
    });

    test('Settings: Dashboard links to Settings page', async ({ page }) => {
        await page.goto('/admin');
        await page.click('a:has-text("Settings")');
        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.locator('h1')).toContainText('Site Management');
    });

    test('Settings: Save and verify site settings', async ({ page }) => {
        const unique = Date.now();
        const name = `TestSite_${unique}`;
        const title = `TestTitle_${unique}`;
        const subtitle = `TestSub_${unique}`;

        await page.goto('/admin/users');
        await page.fill('input[name="site_name"]', name);
        await page.fill('input[name="site_title"]', title);
        await page.fill('input[name="site_subtitle"]', subtitle);
        await page.click('button:has-text("Save Settings")');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('.bg-green-100')).toContainText('Site settings updated');

        await expect(page.locator('input[name="site_name"]')).toHaveValue(name);
        await expect(page.locator('input[name="site_title"]')).toHaveValue(title);
        await expect(page.locator('input[name="site_subtitle"]')).toHaveValue(subtitle);

        await expect(page.locator('header a[href="/"] span')).toHaveText(name);

        await page.goto('/');
        await expect(page.locator('header a[href="/"] span')).toHaveText(name);
        await expect(page.locator('h1')).toHaveText(title);
        await expect(page.locator('h1 + p')).toHaveText(subtitle);

        await page.goto('/admin/users');
        await page.fill('input[name="site_name"]', 'Miniblog');
        await page.fill('input[name="site_title"]', 'MiniBlog');
        await page.fill(
            'input[name="site_subtitle"]',
            'A minimal blog built with Astro and SQLite.',
        );
        await page.click('button:has-text("Save Settings")');
        await page.waitForLoadState('networkidle');
    });
});

test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Users: Create User', async ({ page }) => {
        await page.goto('/admin/users');

        await page.fill('input[name="q"]', '');
        await page.waitForLoadState('networkidle');

        const newUser = `test_${Date.now()}`;
        await page.fill('input[name="username"]', newUser);
        await page.fill('input[name="password"]', 'password123');
        await page.selectOption('form[method="post"] select[name="role"]', 'user');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('tbody')).toContainText(newUser);
    });

    test('Users: Search User', async ({ page }) => {
        await page.goto('/admin/users');

        await page.fill('input[name="q"]', '');
        await page.waitForLoadState('networkidle');

        const userA = `userA_${Date.now()}`;
        const userB = `userB_${Date.now()}`;

        await page.fill('input[name="username"]', userA);
        await page.fill('input[name="password"]', 'password123');
        await page.selectOption('form[method="post"] select[name="role"]', 'user');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('tbody')).toContainText(userA);

        await page.fill('input[name="username"]', userB);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('tbody')).toContainText(userB);

        const input = page.locator('main input[name="q"]');
        await input.fill(userA);
        await page.waitForURL(new RegExp(`q=${userA}`));

        await expect(page.locator('tbody')).toContainText(userA);
        await expect(page.locator('tbody')).not.toContainText(userB);
    });

    test('Users: Change Role & Delete', async ({ page }) => {
        await page.goto('/admin/users');

        await page.fill('input[name="q"]', '');
        await page.waitForLoadState('networkidle');

        const user = `mod_${Date.now()}`;
        await page.fill('input[name="username"]', user);
        await page.fill('input[name="password"]', 'password123');
        await page.selectOption('form[method="post"] select[name="role"]', 'user');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('tbody')).toContainText(user);

        const row = page.locator('tr', { hasText: user });
        await row.locator('select[name="new_role"]').selectOption('admin');
        await page.waitForLoadState('networkidle');

        const rowAfter = page.locator('tr', { hasText: user });
        await expect(rowAfter.locator('select[name="new_role"]')).toHaveValue('admin');

        page.on('dialog', (d) => d.accept());
        await rowAfter.locator('button:has(.sr-only:text("Delete"))').click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('tbody')).not.toContainText(user);
    });

    test('Users: Sort', async ({ page }) => {
        await page.goto('/admin/users');

        await page.click('a:has-text("Created")');
        await page.waitForURL(/sort=created&order=desc/);
        await page.waitForLoadState('networkidle');

        await page.click('a:has-text("Username")');
        await page.waitForURL(/sort=username&order=desc/);
        await page.waitForLoadState('networkidle');

        await page.click('a:has-text("Role")');
        await page.waitForURL(/sort=role&order=desc/);
    });
});
