import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.js',
    timeout: 120 * 1000,
    globalTimeout: 180 * 1000,
    expect: {
        timeout: 10 * 1000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:4321',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
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
            'rm -f miniblog.dev.db && export DB_FILENAME=miniblog.dev.db && bun run db:push:dev && bun run build && node ./dist/server/entry.mjs',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
        env: {
            DB_FILENAME: 'miniblog.dev.db',
            NODE_ENV: 'development',
            HOST: '127.0.0.1',
            PORT: '4321',
            OWNER_CREDENTIALS: 'admin:$2y$10$R25XM0rdbbOx4spY8hRjtO5ceoc/1YjlVgo62qsreKnYrUzaluxzm',
        },
    },
});
