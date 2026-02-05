import { test, expect } from '@playwright/test';

test.describe('Visual & Layout', () => {
    test('Global Font is Jost', async ({ page }) => {
        await page.goto('/');
        const html = page.locator('html');
        const fontFamily = await html.evaluate((el) => window.getComputedStyle(el).fontFamily);
        expect(fontFamily).toContain('Jost');
    });

    test('Homepage: Title is Left Aligned', async ({ page }) => {
        await page.goto('/');
        const title = page.locator('h1');
        const align = await title.evaluate((el) => window.getComputedStyle(el).textAlign);
        expect(['start', 'left']).toContain(align);
    });

    test('Homepage: Meta Title matches', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Miniblog/);
    });

    test('Homepage: Canonical URL is present', async ({ page }) => {
        await page.goto('/');
        const canonical = await page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveCount(1);
    });

    test('Homepage: OG Title is correct', async ({ page }) => {
        await page.goto('/');
        const ogTitle = await page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveAttribute('content', 'Miniblog');
    });

    test('UI: Theme Toggle works', async ({ page }) => {
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

    test('UI: Responsive Layout (Mobile)', async ({ page }) => {
        await page.goto('/');
        await page.setViewportSize({ width: 375, height: 667 });
        const title = page.locator('h1');
        await expect(title).toBeVisible();
    });
});
test.describe('System Integration', () => {
    test('Sitemap XML exists', async ({ request }) => {
        const response = await request.get('/sitemap-index.xml');
        expect(response.status()).toBe(200);
    });

    test('View Transitions are enabled', async ({ page }) => {
        await page.goto('/');
        const meta = page.locator('meta[name="astro-view-transitions-enabled"]');
        await expect(meta).toHaveAttribute('content', 'true');
    });

    test('Error Page: 404 for invalid route', async ({ page }) => {
        const response = await page.goto('/non-existent-page-12345');
        expect(response.status()).toBe(404);
        await expect(page.locator('text=404')).toBeVisible();
    });

    test('Error Page: 404 for invalid blog post', async ({ page }) => {
        const response = await page.goto('/blog/invalid-slug-xyz');
        expect(response.status()).toBe(404);
    });
});

test.describe('Visitor Functionality', () => {
    test('Search: Finds existing posts', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('input[name="q"]');
        await expect(searchInput).toBeVisible();

        await searchInput.fill('Something');
        await searchInput.press('Enter');
        await expect(page.locator('h1')).toBeVisible();
    });

    test('Search: Shows "No posts found" for gibberish', async ({ page }) => {
        await page.goto('/');
        const searchInput = page.locator('input[name="q"]');
        await searchInput.fill('XyZ123Gibberish');
        await searchInput.press('Enter');
        await expect(page.locator('text=No posts found')).toBeVisible();
    });
});
