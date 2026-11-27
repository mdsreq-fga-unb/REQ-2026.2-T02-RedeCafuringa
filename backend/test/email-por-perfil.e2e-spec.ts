// Este arquivo faz muitos cadastros e logins; o limite é testado à parte.
process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.PASSWORD_RESET_COOLDOWN_SECONDS = '0';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { makeConsumer, makeCpf, makeProducer } from '@test/factories';
import { MailService } from '../src/common/mail/mail.service.js';
import { PasswordResetService } from '../src/modules/auth/password-reset/password-reset.service.js';
import { seedAdmin } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const CONSUMERS = '/api/v1/users/consumers';
const PRODUCERS = '/api/v1/users/producers';
const CHECK_PRODUCER = `${PRODUCERS}/check-identity`;
const LOGIN = '/api/v1/auth/login';
const RESET_REQUEST = '/api/v1/auth/password-reset/request';
const RESET_CONFIRM = '/api/v1/auth/password-reset/confirm';

const EMAIL = 'maria@exemplo.com';
const SENHA_CONSUMIDORA = 'Consumidora123';
const SENHA_PRODUTORA = 'Produtora456';

interface SentMail {
  to: string;
  text: string;
}

/**
 * Uma mesma pessoa pode ser consumidora e produtora: as duas contas usam o
 * mesmo e-mail e o mesmo CPF, e o login escolhe a conta pelo perfil da tela.
 * Dentro do mesmo perfil, e-mail e CPF continuam únicos; o e-mail de um
 * administrador continua exclusivo.
 */
describe('Mesmo e-mail e CPF para consumidor e produtor (e2e)', () => {
  let t: TestApp;
  let reset: PasswordResetService;
  const sent: SentMail[] = [];

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue({
        send: vi.fn(async (message: SentMail) => {
          sent.push(message);
        }),
      }),
    );
    reset = t.app.get(PasswordResetService);
  });

  beforeEach(async () => {
    await reset.beforeApplicationShutdown();
    await t.clearDatabase();
    sent.length = 0;
  });

  afterAll(async () => {
    await reset?.beforeApplicationShutdown();
    await t?.close();
  });

  async function registerBoth(cpf = makeCpf()) {
    await t
      .request()
      .post(CONSUMERS)
      .send(makeConsumer({ email: EMAIL, cpf, senha: SENHA_CONSUMIDORA }))
      .expect(201);
    await t
      .request()
      .post(PRODUCERS)
      .send(makeProducer({ email: EMAIL, cpf, senha: SENHA_PRODUTORA }))
      .expect(201);
  }

  const login = (body: object) => t.request().post(LOGIN).send(body);

  describe('cadastro', () => {
    it('consumidora já cadastrada cria a conta de produtora com o mesmo e-mail e CPF', async () => {
      await registerBoth();

      expect(
        await t.connection.collection('users').countDocuments({ email: EMAIL }),
      ).toBe(2);
    });

    it('produtora já cadastrada cria a conta de consumidora com o mesmo e-mail e CPF', async () => {
      const cpf = makeCpf();
      await t
        .request()
        .post(PRODUCERS)
        .send(makeProducer({ email: EMAIL, cpf }))
        .expect(201);

      await t
        .request()
        .post(CONSUMERS)
        .send(makeConsumer({ email: 'MARIA@exemplo.com', cpf }))
        .expect(201);
    });

    it('a primeira etapa do cadastro de produtora não barra quem já é consumidora', async () => {
      const cpf = makeCpf();
      await t
        .request()
        .post(CONSUMERS)
        .send(makeConsumer({ email: EMAIL, cpf }))
        .expect(201);

      await t
        .request()
        .post(CHECK_PRODUCER)
        .send({ email: EMAIL, cpf })
        .expect(204);
    });

    it('continua recusando uma segunda conta no mesmo perfil', async () => {
      await registerBoth();

      const consumer = await t
        .request()
        .post(CONSUMERS)
        .send(makeConsumer({ email: EMAIL }))
        .expect(409);
      expect(consumer.body.message).toBe('E-mail já cadastrado');

      const producer = await t
        .request()
        .post(PRODUCERS)
        .send(makeProducer({ email: EMAIL }))
        .expect(409);
      expect(producer.body.message).toBe('E-mail já cadastrado');
    });

    it('o e-mail de um administrador continua exclusivo', async () => {
      await seedAdmin(t, EMAIL);

      await t
        .request()
        .post(CONSUMERS)
        .send(makeConsumer({ email: EMAIL }))
        .expect(409);
      await t
        .request()
        .post(PRODUCERS)
        .send(makeProducer({ email: EMAIL }))
        .expect(409);
    });
  });

  describe('login', () => {
    it('entra na conta do perfil informado', async () => {
      await registerBoth();

      const consumer = await login({
        email: EMAIL,
        senha: SENHA_CONSUMIDORA,
        perfil: 'CONSUMIDOR',
      }).expect(200);
      expect(consumer.body.usuario.perfil).toBe('CONSUMIDOR');

      const producer = await login({
        email: EMAIL,
        senha: SENHA_PRODUTORA,
        perfil: 'PRODUTOR',
      }).expect(200);
      expect(producer.body.usuario.perfil).toBe('PRODUTOR');
    });

    it('a senha de uma conta não abre a outra', async () => {
      await registerBoth();

      await login({
        email: EMAIL,
        senha: SENHA_PRODUTORA,
        perfil: 'CONSUMIDOR',
      }).expect(401);
      await login({
        email: EMAIL,
        senha: SENHA_CONSUMIDORA,
        perfil: 'PRODUTOR',
      }).expect(401);
    });

    it('sem perfil, e-mail com duas contas é recusado com o 401 genérico', async () => {
      await registerBoth();

      const response = await login({
        email: EMAIL,
        senha: SENHA_CONSUMIDORA,
      }).expect(401);
      expect(response.body.message).toBe('E-mail ou senha inválidos');
    });

    it('o administrador entra por qualquer tela de login', async () => {
      const admin = await seedAdmin(t, EMAIL);

      for (const perfil of ['PRODUTOR', 'CONSUMIDOR']) {
        const response = await login({
          email: EMAIL,
          senha: admin.senha,
          perfil,
        }).expect(200);
        expect(response.body.usuario.perfil).toBe('ADMINISTRADOR');
      }
    });

    it.each(['ADMINISTRADOR', 'qualquer'])(
      'recusa perfil %s no login com 400',
      async (perfil) => {
        await login({ email: EMAIL, senha: SENHA_CONSUMIDORA, perfil }).expect(
          400,
        );
      },
    );
  });

  describe('recuperação de senha', () => {
    it('redefine só a senha da conta do perfil informado', async () => {
      await registerBoth();

      await t
        .request()
        .post(RESET_REQUEST)
        .send({ email: EMAIL, perfil: 'PRODUTOR' })
        .expect(202);
      await vi.waitFor(() => expect(sent).toHaveLength(1));
      const token = /token=([A-Za-z0-9_-]{43})/.exec(sent[0].text)?.[1];

      await t
        .request()
        .post(RESET_CONFIRM)
        .send({ token, novaSenha: 'NovaSenha789' })
        .expect(200);

      await login({
        email: EMAIL,
        senha: 'NovaSenha789',
        perfil: 'PRODUTOR',
      }).expect(200);
      await login({
        email: EMAIL,
        senha: SENHA_CONSUMIDORA,
        perfil: 'CONSUMIDOR',
      }).expect(200);
    });
  });
});
