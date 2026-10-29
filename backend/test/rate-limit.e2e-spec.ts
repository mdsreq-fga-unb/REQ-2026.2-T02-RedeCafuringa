process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '2';

import { createTestApp, TestApp } from './utils/test-app.js';

describe('Rate limit (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  it('retorna 429 após exceder o limite configurado', async () => {
    await t.request().get('/api/v1/health/live').expect(200);
    await t.request().get('/api/v1/health/live').expect(200);

    const response = await t.request().get('/api/v1/health/live').expect(429);

    expect(response.headers['retry-after']).toBeDefined();
  });
});
