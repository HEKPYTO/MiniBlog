import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.js',
    timeout: 60 * 1000,
    expect: {
        timeout: 10 * 1000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:4321',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
    ],
    webServer: {
        command:
            'rm -f miniblog.db && export DB_FILENAME=miniblog.db && bun run db:push && bun run build && node ./dist/server/entry.mjs',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
            DB_FILENAME: 'miniblog.db',
            NODE_ENV: 'production',
            HOST: '127.0.0.1',
            PORT: '4321',
            OWNER_CREDENTIALS: 'admin:$2y$05$mGBNpRfJwgF1I1wNlVlkgON7rdIkOxAH6sF6Pn3FT75RUwCY2Pnqe',
        },
    },
});
