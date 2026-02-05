import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
    test('GET /api/health returns 200 OK', async ({ request }) => {
        const response = await request.get('/api/health');
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toMatchObject({ status: 'ok' });
    });
});
