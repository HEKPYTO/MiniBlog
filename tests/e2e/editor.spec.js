import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe.configure({ mode: 'serial' });

test.describe('Editor Functionality Suite', () => {
    async function setupUser(page) {
        const uniqueUsername = `adm_${Date.now().toString().slice(-5)}_${Math.random().toString(36).slice(2, 5)}`;
        const testPassword = 'password123!';

        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);

        await page.goto('/admin/users');
        await page.fill('input[name="username"]', uniqueUsername);
        await page.fill('input[name="password"]', testPassword);
        await page.selectOption('form[method="post"] select[name="role"]', 'admin');
        await page.click('button:has-text("Create User")');
        await page.waitForLoadState('networkidle');

        await page.click('button:has-text("Logout"), a:has-text("Logout")');
        await page.waitForURL('http://127.0.0.1:4321/');

        await page.goto('/login');
        await page.fill('input[name="username"]', uniqueUsername);
        await page.fill('input[name="password"]', testPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);

        await page.goto('/admin/editor');
        await expect(page.locator('#markdown-input')).toBeVisible({ timeout: 10000 });

        return uniqueUsername;
    }

    test('UI Elements Presence', async ({ page }) => {
        await setupUser(page);

        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('#markdown-input')).toBeVisible();
        await expect(page.locator('#preview')).toBeVisible();
        await expect(page.locator('button:has-text("Save")')).toBeVisible();
        await expect(page.locator('button[title="Back to Dashboard"]')).toBeVisible();
        await expect(page.locator('#settings-panel')).toBeVisible();
    });

    test('Markdown Preview Generation', async ({ page }) => {
        await setupUser(page);

        const editor = page.locator('#markdown-input');
        const preview = page.locator('#preview');

        await editor.fill('# Heading 1\n\n**Bold Text**');

        await expect(preview.locator('h1')).toHaveText('Heading 1');
        await expect(preview.locator('strong')).toHaveText('Bold Text');
    });

    test('Slug Auto-generation', async ({ page }) => {
        await setupUser(page);

        await page.fill('input[name="title"]', 'My Awesome Post!');

        await expect(page.locator('#slug')).toHaveValue('my-awesome-post');
    });

    test('Save New Post (Draft)', async ({ page }) => {
        await setupUser(page);

        const title = `Draft Post ${Date.now()}`;
        await page.fill('input[name="title"]', title);
        await page.fill('#markdown-input', 'Content');
        await page.fill('input[name="date"]', '01/01/2026');
        await page.fill('input[name="time"]', '12:00');
        await page.click('button:has-text("Save")', { force: true });

        await expect(page).toHaveURL(/id=/);

        await page.reload();
        await expect(page.locator('input[name="title"]')).toHaveValue(title);
        await expect(page.locator('#status')).toHaveValue('draft');
    });

    test('Update Existing Post', async ({ page }) => {
        await setupUser(page);

        const suffix = Date.now();
        await page.fill('input[name="title"]', `Original Title ${suffix}`);
        await page.fill('#markdown-input', 'Original Content');
        await page.selectOption('#status', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        const postId = new URL(page.url()).searchParams.get('id');

        await page.fill('input[name="title"]', `Updated Title ${suffix}`);
        await page.selectOption('#status', 'draft');
        await page.click('button:has-text("Save")');
        await page.waitForURL((url) => !url.toString().includes('/editor'), { timeout: 15000 });

        await page.goto(`/admin/editor?id=${postId}`);
        await expect(page.locator('input[name="title"]')).toHaveValue(`Updated Title ${suffix}`);
        await expect(page.locator('#status')).toHaveValue('draft');
    });

    test('Collapse Settings Panel & Persistence', async ({ page }) => {
        await setupUser(page);

        const panel = page.locator('#settings-panel');
        const toggle = page.locator('#settings-toggle');

        const initialBox = await panel.boundingBox();
        expect(initialBox.height).toBeGreaterThan(100);

        await toggle.click();

        const collapsedBox = await panel.boundingBox();
        expect(collapsedBox.height).toBeLessThan(100);
        await expect(panel).toHaveClass(/border-t/);

        await page.reload();
        await page.waitForSelector('#editor-pane');
        const reloadedBox = await panel.boundingBox();
        expect(reloadedBox.height).toBeLessThan(100);

        await page.goto('/admin');
        await page.goto('/admin/editor');
        const returnedBox = await panel.boundingBox();
        expect(returnedBox.height).toBeLessThan(100);

        const toggleBox = await toggle.boundingBox();

        await page.mouse.move(
            toggleBox.x + toggleBox.width / 2,
            toggleBox.y + toggleBox.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(toggleBox.x, toggleBox.y - 200, { steps: 10 });
        await page.mouse.up();

        const expandedBox = await panel.boundingBox();
        expect(expandedBox.height).toBeGreaterThan(150);
    });

    test('Import/Export Roundtrip', async ({ page }) => {
        await setupUser(page);

        const importContent = '# Roundtrip Test\n\nContent for roundtrip.';
        const importPath = path.join('test-results', 'roundtrip.md');
        if (!fs.existsSync('test-results')) fs.mkdirSync('test-results');
        fs.writeFileSync(importPath, importContent);

        await page.locator('input[type="file"]').setInputFiles(importPath);
        await expect(page.locator('#markdown-input')).toHaveValue(importContent);

        await page.fill('input[name="title"]', 'Roundtrip Post');

        const downloadPromise = page.waitForEvent('download');
        await page.click('#export-btn');
        const download = await downloadPromise;
        const downloadPath = await download.path();
        const exportedContent = fs.readFileSync(downloadPath, 'utf8');

        expect(exportedContent).toContain(importContent);
        expect(exportedContent).toContain('title: "Roundtrip Post"');
    });

    test('Vertical Resize (Snap-to-Collapse)', async ({ page }) => {
        await setupUser(page);

        const resizer = page.locator('#vertical-resizer');
        const panel = page.locator('#settings-panel');

        const initialBox = await panel.boundingBox();
        if (initialBox.height < 100) {
            await page.click('#settings-toggle');
        }

        const vResizerBox = await resizer.boundingBox();

        await page.mouse.move(
            vResizerBox.x + vResizerBox.width / 2,
            vResizerBox.y + vResizerBox.height / 2,
        );
        await page.mouse.down();

        await page.mouse.move(vResizerBox.x, vResizerBox.y + 250, { steps: 10 });
        await page.mouse.up();

        const collapsedBox = await panel.boundingBox();
        expect(collapsedBox.height).toBeLessThan(60);
    });

    test('Navigation Shortcuts', async ({ page }) => {
        await setupUser(page);

        await page.click('button[title="Back to Dashboard"]');
        await expect(page).toHaveURL(/\/admin$/);

        const suffix = Date.now();
        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', `Shortcut Test ${suffix}`);
        await page.fill('#markdown-input', 'Content');
        await page.selectOption('#status', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        const postId = new URL(page.url()).searchParams.get('id');
        const slug = await page.locator('#slug').inputValue();
        await page.goto(`/blog/${slug}`);
        const editLink = page.locator(`a[href="/admin/editor?id=${postId}"]`);
        await expect(editLink).toBeAttached();

        await editLink.click({ force: true });

        await expect(page).toHaveURL(/\/admin\/editor/);
        expect(page.url()).toContain(postId);
    });

    test('Slug Collision Toast', async ({ page }) => {
        await setupUser(page);

        const existingSlug = `collision-target-${Date.now()}`;
        await page.fill('input[name="title"]', 'Target Post');
        await page.fill('input[name="slug"]', existingSlug);
        await page.fill('#markdown-input', 'Content');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        await page.goto('/admin/editor');

        await page.fill('input[name="title"]', 'New Post');
        await page.fill('input[name="slug"]', existingSlug);
        await page.fill('#markdown-input', 'New Content');
        await page.click('button:has-text("Save")');

        await expect(page).toHaveURL('/admin/editor');
        const toast = page.locator('#toast-message');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText(`Slug "${existingSlug}" is already in use`);
    });

    test('Date and Time Inputs', async ({ page }) => {
        await setupUser(page);

        const dateInput = page.locator('#date');
        const timeInput = page.locator('#time');
        await expect(dateInput).toBeVisible();
        await expect(timeInput).toBeVisible();

        await dateInput.fill('15/06/2026');
        await timeInput.fill('12:00');

        await expect(dateInput).toHaveValue('15/06/2026');
        await expect(timeInput).toHaveValue('12:00');

        await page.fill('input[name="title"]', `Date Time Input Test ${Date.now()}`);
        await page.fill('#markdown-input', 'Content');
        await page.selectOption('#status', 'published');
        await page.click('button:has-text("Save")');

        await expect(page).toHaveURL(/id=/);

        await page.reload();
        await expect(page.locator('#date')).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);
        await expect(page.locator('#time')).toHaveValue(/\d{2}:\d{2}/);
    });
});
