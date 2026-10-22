import { createTestApp, TestApp } from './utils/test-app.js';

describe('Health (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  it('GET /api/v1/health retorna status ok com o MongoDB conectado', async () => {
    const response = await t.request().get('/api/v1/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: { mongodb: { status: 'up' } },
    });
  });
});
