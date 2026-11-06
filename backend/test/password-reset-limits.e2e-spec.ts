process.env.AUTH_THROTTLE_LIMIT = '3';

import { MailService } from '../src/common/mail/mail.service.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const REQUEST = '/api/v1/auth/password-reset/request';
const VALIDATE = '/api/v1/auth/password-reset/validate';
const CONFIRM = '/api/v1/auth/password-reset/confirm';

describe('HU10 — limites contra abuso (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder
        .overrideProvider(MailService)
        .useValue({ send: vi.fn().mockResolvedValue(undefined) }),
    );
  });

  afterAll(async () => {
    await t?.close();
  });

  it('RNF08: excesso de pedidos por IP recebe 429 com o tempo de espera', async () => {
    const statuses: number[] = [];
    let waitHeaders: Record<string, unknown> = {};
    for (let i = 0; i < 5; i++) {
      const response = await t
        .request()
        .post(REQUEST)
        .send({ email: 'x@exemplo.com' });
      statuses.push(response.status);
      if (response.status === 429) waitHeaders = response.headers;
    }

    expect(statuses.slice(0, 3)).toEqual([202, 202, 202]);
    expect(statuses.at(-1)).toBe(429);
    const retryKey = Object.keys(waitHeaders).find((key) =>
      key.startsWith('retry-after'),
    );
    expect(retryKey).toBeDefined();
    expect(Number(waitHeaders[retryKey as string])).toBeGreaterThan(0);
  });

  it('validar e redefinir também têm limite estrito (tentativa de adivinhar o token)', async () => {
    for (const route of [VALIDATE, CONFIRM]) {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i++) {
        const response = await t
          .request()
          .post(route)
          .send({ token: 'A'.repeat(43), novaSenha: 'NovaSenha456' });
        statuses.push(response.status);
      }

      expect(statuses.slice(0, 3)).toEqual([400, 400, 400]);
      expect(statuses.at(-1)).toBe(429);
    }
  });
});
