import { test, expect } from '@playwright/test';

test.describe('SEO & Metadata', () => {
    test('Homepage: Standard Meta Tags', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Miniblog/);

        const description = page.locator('meta[name="description"]');
        await expect(description).toHaveAttribute('content', /minimal blog/i);

        const viewport = page.locator('meta[name="viewport"]');
        await expect(viewport).toHaveAttribute('content', 'width=device-width');

        const robots = page.locator('meta[name="robots"]');
        await expect(robots).toHaveAttribute('content', 'index, follow');

        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveAttribute('href', /https:\/\/miniblog\.tsunyanapat\.com\/?/);
    });

    test('Homepage: Open Graph Tags', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
            'content',
            'website',
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
            'content',
            /Miniblog/,
        );
        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
            'content',
            /minimal blog/i,
        );
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
            'content',
            /https:\/\/miniblog\.tsunyanapat\.com\/?/,
        );
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
            'content',
            /icon\.svg/,
        );
    });

    test('Homepage: Twitter Card Tags', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('meta[property="twitter:card"]')).toHaveAttribute(
            'content',
            'summary_large_image',
        );
        await expect(page.locator('meta[property="twitter:title"]')).toHaveAttribute(
            'content',
            /Miniblog/,
        );
        await expect(page.locator('meta[property="twitter:description"]')).toHaveAttribute(
            'content',
            /minimal blog/i,
        );
        await expect(page.locator('meta[property="twitter:image"]')).toHaveAttribute(
            'content',
            /icon\.svg/,
        );
    });

    test('Blog Post: SEO & Schema', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);

        const suffix = Date.now();
        const slug = `seo-test-${suffix}`;
        await page.goto('/admin/editor');
        await page.fill('input[name="title"]', `SEO Test Post ${suffix}`);
        await page.fill('input[name="slug"]', slug);
        await page.fill('textarea[name="excerpt"]', 'This is a custom excerpt for SEO testing.');
        await page.fill('textarea[name="content"]', 'Content here.');
        await page.selectOption('select[name="status"]', 'published');
        await page.click('button:has-text("Save")');
        await page.waitForURL(/id=/);

        await page.goto(`/blog/${slug}`);

        await expect(page).toHaveTitle(new RegExp(`SEO Test Post ${suffix}`));
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
            'content',
            'This is a custom excerpt for SEO testing.',
        );

        await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
            'content',
            'article',
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
            'content',
            `SEO Test Post ${suffix}`,
        );
        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
            'content',
            'This is a custom excerpt for SEO testing.',
        );
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
            'content',
            new RegExp(`/og/${slug}.png`),
        );

        const schemaScript = page.locator('script[type="application/ld+json"]');
        const schemaContent = await schemaScript.textContent();
        const schema = JSON.parse(schemaContent);

        expect(schema['@type']).toBe('BlogPosting');
        expect(schema.headline).toBe(`SEO Test Post ${suffix}`);
        expect(schema.description).toBe('This is a custom excerpt for SEO testing.');
        expect(schema.author[0].name).toBe('admin');
    });
});
