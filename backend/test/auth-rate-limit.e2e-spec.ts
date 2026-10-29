process.env.AUTH_THROTTLE_LIMIT = '2';

import { createTestApp, TestApp } from './utils/test-app.js';

const credentials = { cpf: '52998224725', senha: 'SenhaErrada123' };

describe('Rate limit da autenticação (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  it('retorna 429 após exceder as tentativas de login (força bruta)', async () => {
    await t.request().post('/api/v1/auth/login').send(credentials).expect(401);
    await t.request().post('/api/v1/auth/login').send(credentials).expect(401);

    await t.request().post('/api/v1/auth/login').send(credentials).expect(429);
  });

  it('o limite de autenticação não afeta as demais rotas', async () => {
    await t.request().get('/api/v1/health/live').expect(200);
  });
});
