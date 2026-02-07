import { test, expect } from '@playwright/test';

test.describe('Visual & Layout', () => {
    test('Visual: Global Font is Jost', async ({ page }) => {
        await page.goto('/');
        const html = page.locator('html');
        const fontFamily = await html.evaluate((el) => window.getComputedStyle(el).fontFamily);
        expect(fontFamily).toContain('Jost');
    });

    test('Visual: Homepage Title is Left Aligned', async ({ page }) => {
        await page.goto('/');
        const title = page.locator('h1');
        const align = await title.evaluate((el) => window.getComputedStyle(el).textAlign);
        expect(['start', 'left']).toContain(align);
    });

    test('Visual: Homepage Meta Title matches', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Miniblog/);
    });

    test('Visual: Homepage Canonical URL is present', async ({ page }) => {
        await page.goto('/');
        const canonical = await page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveCount(1);
    });

    test('Visual: Homepage OG Title is correct', async ({ page }) => {
        await page.goto('/');
        const ogTitle = await page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveAttribute('content', 'Miniblog');
    });

    test('Visual: Theme Toggle works', async ({ page }) => {
        await page.goto('/');
        const html = page.locator('html');
        const initialClass = await html.getAttribute('class');
        await page.click('#theme-toggle');

        if (initialClass?.includes('dark')) {
            await expect(html).not.toHaveClass(/dark/);
        } else {
            await expect(html).toHaveClass(/dark/);
        }
    });

    test('Visual: Responsive Layout (Mobile)', async ({ page }) => {
        await page.goto('/');
        await page.setViewportSize({ width: 375, height: 667 });
        const title = page.locator('h1');
        await expect(title).toBeVisible();
    });
});
test.describe('System Integration', () => {
    test('System: Sitemap XML exists', async ({ request }) => {
        const response = await request.get('/sitemap-index.xml');
        expect(response.status()).toBe(200);
    });

    test('System: View Transitions are enabled', async ({ page }) => {
        await page.goto('/');
        const meta = page.locator('meta[name="astro-view-transitions-enabled"]');
        await expect(meta).toHaveAttribute('content', 'true');
    });

    test('System: Error Page (404 for invalid route)', async ({ page }) => {
        const response = await page.goto('/non-existent-page-12345');
        expect(response.status()).toBe(404);
        await expect(page.locator('text=404')).toBeVisible();
    });

    test('System: Error Page (404 for invalid blog post)', async ({ page }) => {
        const response = await page.goto('/blog/invalid-slug-xyz');
        expect(response.status()).toBe(404);
    });

    test('System: OG Image returns valid PNG for published post', async ({ page, request }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);

        const suffix = Date.now();
        const slug = `og-test-${suffix}`;
        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', `OG Test ${suffix}`);
        await page.fill('input[name="slug"]', slug);
        await page.fill('textarea[name="content"]', 'Test content for OG image.');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/id=/);

        const response = await request.get(`/og/${slug}.png`);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');

        const body = await response.body();
        expect(body[0]).toBe(0x89);
        expect(body[1]).toBe(0x50);
        expect(body[2]).toBe(0x4e);
        expect(body[3]).toBe(0x47);
        expect(body.length).toBeGreaterThan(1000);
    });

    test('System: OG Image returns 404 for non-existent slug', async ({ request }) => {
        const response = await request.get('/og/non-existent-slug-xyz.png');
        expect(response.status()).toBe(404);
    });
});

test.describe('Visitor Functionality', () => {
    test('Visitor: Search Finds Existing Posts', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('input[name="q"]');
        await expect(searchInput).toBeVisible();

        await searchInput.fill('Something');
        await searchInput.press('Enter');
        await expect(page.locator('h1')).toBeVisible();
    });

    test('Visitor: Search Shows "No posts found" for Gibberish', async ({ page }) => {
        await page.goto('/');
        const searchInput = page.locator('input[name="q"]');
        await searchInput.fill('XyZ123Gibberish');
        await searchInput.press('Enter');
        await expect(page.locator('text=No posts found')).toBeVisible();
    });
});
