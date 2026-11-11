import { createTestApp, TestApp } from './utils/test-app.js';

describe('Swagger UI (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  it('serve a UI em /api/v1/docs quando SWAGGER_ENABLED está ligado (padrão fora de produção)', async () => {
    const response = await t.request().get('/api/v1/docs').expect(200);

    expect(response.text).toContain('swagger-ui');
  });

  it('serve o contrato em /api/v1/docs-json', async () => {
    const response = await t.request().get('/api/v1/docs-json').expect(200);

    expect(response.body.info.title).toBe('Rede Cafuringa API');
  });
});
