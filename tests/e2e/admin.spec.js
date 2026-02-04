import { test, expect } from '@playwright/test';

async function login(page, username = 'admin', password = 'password123') {
    await page.goto('/login');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
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
        await page.$eval('input[name="publishedAt"]', (el) => (el.value = '2000-01-01T12:00'));
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', newTitle);
        await page.fill('textarea[name="content"]', 'New');
        await page.$eval('input[name="publishedAt"]', (el) => (el.value = '2050-01-01T12:00'));
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin');

        await page.click('a:has-text("Date")');
        await page.waitForURL(/sort=publishedAt&order=desc/);
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toContainText(newTitle);

        await page.click('a:has-text("Date")');
        await page.waitForURL(/sort=publishedAt&order=asc/);
        const firstRowAsc = page.locator('tbody tr').first();
        await expect(firstRowAsc).toContainText(oldTitle);
    });
});

test.describe('Editor Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Editor: Create New Post', async ({ page }) => {
        await page.goto('/admin/editor');
        const title = `New Post ${Date.now()}`;
        await page.fill('input[name="title"]', title);
        await page.fill('textarea[name="content"]', '# Hello');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');

        await expect(page).toHaveURL(/id=/);
        await page.goto('/');
        await expect(page.locator(`text=${title}`)).toBeVisible();
    });

    test('Editor: Update Existing Post', async ({ page }) => {
        await page.goto('/admin/editor');
        const title = `UpdateMe ${Date.now()}`;
        await page.fill('input[name="title"]', title);
        await page.fill('textarea[name="content"]', 'Original');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.fill('textarea[name="content"]', 'Updated Content');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/');
        await page.click(`text=${title}`);
        await expect(page.locator('.prose')).toContainText('Updated Content');
    });
});

test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Users: Create User', async ({ page }) => {
        await page.goto('/admin/users');
        const newUser = `test_${Date.now()}`;
        await page.fill('input[name="username"]', newUser);
        await page.fill('input[name="password"]', 'password123');
        await page.locator('form[method="post"] select[name="role"]').selectOption('user');
        await page.click('button:has-text("Create User")');
        await expect(page.locator('tbody')).toContainText(newUser);
    });

    test('Users: Search User', async ({ page }) => {
        const userA = `userA_${Date.now()}`;
        const userB = `userB_${Date.now()}`;

        await page.goto('/admin/users');
        await page.fill('input[name="username"]', userA);
        await page.fill('input[name="password"]', 'password123');
        await page.locator('form[method="post"] select[name="role"]').selectOption('user');
        await page.click('button:has-text("Create User")');
        await expect(page.locator('tbody')).toContainText(userA);

        await page.fill('input[name="username"]', userB);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Create User")');
        await expect(page.locator('tbody')).toContainText(userB);

        const input = page.locator('main input[name="q"]');
        await input.fill(userA);
        await page.waitForURL(new RegExp(`q=${userA}`));

        await expect(page.locator('tbody')).toContainText(userA);
        await expect(page.locator('tbody')).not.toContainText(userB);
    });

    test('Users: Change Role & Delete', async ({ page }) => {
        await page.goto('/admin/users');
        const user = `mod_${Date.now()}`;
        await page.fill('input[name="username"]', user);
        await page.fill('input[name="password"]', 'password123');
        await page.locator('form[method="post"] select[name="role"]').selectOption('user');
        await page.click('button:has-text("Create User")');
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

        await page.click('a:has-text("Username")');
        await page.waitForURL(/sort=username&order=desc/);

        await page.click('a:has-text("Role")');
        await page.waitForURL(/sort=role&order=desc/);
    });
});
