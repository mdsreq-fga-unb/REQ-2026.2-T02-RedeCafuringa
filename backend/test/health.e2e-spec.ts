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

  it('GET /api/v1/health/ready retorna status ok com o MongoDB conectado', async () => {
    const response = await t.request().get('/api/v1/health/ready').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: { mongodb: { status: 'up' } },
    });
  });

  it('GET /api/v1/health/live não depende do MongoDB', async () => {
    const response = await t.request().get('/api/v1/health/live').expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
    expect(response.body.info).toEqual({});
  });

  it('respeita o CORS da origem permitida', async () => {
    const response = await t
      .request()
      .get('/api/v1/health/live')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  it('não devolve CORS para origem não permitida', async () => {
    const response = await t
      .request()
      .get('/api/v1/health/live')
      .set('Origin', 'https://evil.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('aplica Helmet e devolve o request id', async () => {
    const response = await t
      .request()
      .get('/api/v1/health/live')
      .set('x-request-id', 'test-request-id')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toBe('test-request-id');
  });

  it('GET /api/v1/metrics expõe métricas Prometheus em texto', async () => {
    const response = await t.request().get('/api/v1/metrics').expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('cafuringa_http_requests_total');
    expect(response.text).toContain('cafuringa_http_request_duration_seconds');
  });
});
