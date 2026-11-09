process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.PASSWORD_RESET_COOLDOWN_SECONDS = '60';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { MailService } from '../src/common/mail/mail.service.js';
import { Role } from '../src/modules/users/domain/role.js';
import { seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const REQUEST = '/api/v1/auth/password-reset/request';

describe('HU10 — intervalo mínimo e concorrência entre pedidos (e2e)', () => {
  let t: TestApp;
  const send = vi.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue({ send }),
    );
    // Garante o índice único por conta antes dos testes de concorrência.
    await t.connection.model('PasswordResetToken').init();
  });

  beforeEach(async () => {
    await t.clearDatabase();
    send.mockReset();
    send.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await t?.close();
  });

  const tokensOf = () =>
    t.connection.collection('password_reset_tokens').countDocuments();

  it('RNF11: pedidos seguidos para a mesma conta geram um único e-mail, com a mesma resposta', async () => {
    const { email } = await seedUser(t, Role.CONSUMIDOR);

    const first = await t.request().post(REQUEST).send({ email }).expect(202);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const second = await t.request().post(REQUEST).send({ email }).expect(202);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(send).toHaveBeenCalledTimes(1);
    expect(second.body).toEqual(first.body);
  });

  it('pedidos simultâneos para a mesma conta: um único link e um único e-mail', async () => {
    const { email } = await seedUser(t, Role.CONSUMIDOR);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        t.request().post(REQUEST).send({ email }),
      ),
    );

    expect(responses.every((r) => r.status === 202)).toBe(true);
    await vi.waitFor(() => expect(send).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(send).toHaveBeenCalledTimes(1);
    expect(await tokensOf()).toBe(1);
  });

  it('o intervalo vale por conta: outra conta pode pedir ao mesmo tempo', async () => {
    const a = await seedUser(t, Role.CONSUMIDOR);
    const b = await seedUser(t, Role.CONSUMIDOR);

    await t.request().post(REQUEST).send({ email: a.email }).expect(202);
    await t.request().post(REQUEST).send({ email: b.email }).expect(202);

    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  });

  it('SMTP fora: reenvia; se não entregar, libera a conta para pedir de novo na hora', async () => {
    const { email } = await seedUser(t, Role.CONSUMIDOR);
    send.mockRejectedValue(new Error('SMTP fora'));

    await t.request().post(REQUEST).send({ email }).expect(202);
    // 1 tentativa + 1 reenvio (MAIL_RETRY_DELAYS_MS=0), e o pedido é desfeito.
    await vi.waitFor(async () => {
      expect(send).toHaveBeenCalledTimes(2);
      expect(await tokensOf()).toBe(0);
    });

    send.mockReset();
    send.mockResolvedValue(undefined);
    await t.request().post(REQUEST).send({ email }).expect(202);

    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(await tokensOf()).toBe(1);
  });

  it('SMTP com falha passageira: o reenvio entrega e o link vale', async () => {
    const { email } = await seedUser(t, Role.CONSUMIDOR);
    send.mockRejectedValueOnce(new Error('SMTP fora'));

    await t.request().post(REQUEST).send({ email }).expect(202);

    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(await tokensOf()).toBe(1);
  });
});
