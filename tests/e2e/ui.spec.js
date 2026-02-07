import { test, expect } from '@playwright/test';

test.describe('UI Stability & Layout', () => {
    test('Global: Overscroll protection enabled', async ({ page }) => {
        await page.goto('/');

        const htmlOverscroll = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement).overscrollBehavior;
        });
        expect(htmlOverscroll).toBe('none');

        const bodyOverscroll = await page.evaluate(() => {
            return window.getComputedStyle(document.body).overscrollBehavior;
        });
        expect(bodyOverscroll).toBe('none');
    });

    test('Header: Extension pseudo-element exists', async ({ page }) => {
        await page.goto('/');

        const header = page.locator('header');
        await expect(header).toBeVisible();

        const beforeStyle = await page.evaluate(() => {
            const header = document.querySelector('header');
            if (!header) return null;
            const style = window.getComputedStyle(header, '::before');
            return {
                content: style.content,
                position: style.position,
                bottom: style.bottom,
                height: style.height,
                backgroundColor: style.backgroundColor,
            };
        });

        expect(beforeStyle.content).not.toBe('none');
        expect(beforeStyle.position).toBe('absolute');
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        const heightValue = parseFloat(beforeStyle.height);
        expect(heightValue).toBeGreaterThanOrEqual(viewportHeight);
    });

    test('Header: Sticky Behavior', async ({ page }) => {
        await page.goto('/');

        const header = page.locator('header');
        await expect(header).toBeVisible();

        const position = await header.evaluate((el) => window.getComputedStyle(el).position);
        expect(position).toBe('sticky');
    });
});

test.describe('UI Interactions', () => {
    test('Theme: Toggle Persistence', async ({ page }) => {
        await page.goto('/');

        const html = page.locator('html');
        const themeButton = page.locator('#theme-toggle');

        await themeButton.click();
        await expect(html).toHaveClass(/dark/);

        await page.reload();
        await expect(html).toHaveClass(/dark/);

        await themeButton.click();
        await expect(html).not.toHaveClass(/dark/);

        await page.reload();
        await expect(html).not.toHaveClass(/dark/);
    });

    test('Login: Error Message Appearance', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'wronguser');
        await page.fill('input[name="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        const errorMessage = page.locator('p.text-red-500');

        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Incorrect username or password');
    });

    test('404: Page Styling', async ({ page }) => {
        await page.goto('/non-existent-page-ui-test');

        const title = page.locator('h1');
        await expect(title).toHaveText('404');

        const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
        expect(parseInt(fontSize)).toBeGreaterThan(50);

        const backButton = page.locator('a[href="/"] button');
        await expect(backButton).toBeVisible();
    });

    test('Forms: Input States', async ({ page }) => {
        await page.goto('/login');

        const input = page.locator('input[name="username"]');

        await input.focus();
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
    });
});
