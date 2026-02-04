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

test.describe('Authentication', () => {
    test('Register: Success Flow', async ({ page }) => {
        const username = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const password = 'password123';

        await page.goto('/register');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Logout')).toBeVisible();
    });

    test('Register: Fail on Short Password', async ({ page }) => {
        await page.goto('/register');
        await page.evaluate(() => (document.querySelector('form').noValidate = true));
        await page.fill('input[name="username"]', 'validuser');
        await page.fill('input[name="password"]', 'short');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });

    test('Register: Fail on Invalid Username Chars', async ({ page }) => {
        await page.goto('/register');
        await page.fill('input[name="username"]', 'user name');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Invalid username')).toBeVisible();
    });

    test('Register: Fail on Username Length > 31', async ({ page }) => {
        await page.goto('/register');
        await page.evaluate(() =>
            document.querySelector('input[name="username"]').removeAttribute('maxlength'),
        );
        await page.fill('input[name="username"]', 'a'.repeat(32));
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Invalid username')).toBeVisible();
    });

    test('Login: Success Flow', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Logout')).toBeVisible();
    });

    test('Login: Fail on Wrong Password', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'wrongpass');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Incorrect username or password')).toBeVisible();
    });

    test('Login: Fail on Non-existent User', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'nouser');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Incorrect username or password')).toBeVisible();
    });

    test('Logout: Clears Session', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Logout')).toBeVisible();

        await page.click('text=Logout');
        await expect(page.locator('text=Login')).toBeVisible();

        const response = await page.goto('/admin');
        expect(response.url()).toMatch(/http:\/\/(localhost|127\.0\.0\.1):4321\//);
    });
});
