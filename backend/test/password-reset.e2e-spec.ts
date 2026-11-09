process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.PASSWORD_RESET_COOLDOWN_SECONDS = '0';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { createHash } from 'node:crypto';
import { makeProducer, VALID_PASSWORD } from '@test/factories';
import { MailService } from '../src/common/mail/mail.service.js';
import { Role } from '../src/modules/users/domain/role.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { forgeToken, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const REQUEST = '/api/v1/auth/password-reset/request';
const VALIDATE = '/api/v1/auth/password-reset/validate';
const CONFIRM = '/api/v1/auth/password-reset/confirm';
const LOGIN = '/api/v1/auth/login';
const NOVA_SENHA = 'NovaSenha456';
const INVALID_LINK =
  'Link de recuperação inválido ou expirado. Solicite uma nova recuperação de acesso.';

interface SentMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

describe('HU10 — Recuperar acesso à conta (e2e)', () => {
  let t: TestApp;
  const sent: SentMail[] = [];
  const fakeMail = {
    send: vi.fn(async (message: SentMail) => {
      sent.push(message);
    }),
  };

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue(fakeMail),
    );
  });

  beforeEach(async () => {
    await t.clearDatabase();
    sent.length = 0;
    fakeMail.send.mockClear();
  });

  afterAll(async () => {
    await t?.close();
  });

  const mailsTo = (email: string) => sent.filter((mail) => mail.to === email);

  /**
   * O e-mail é enviado depois da resposta: espera chegar um e-mail novo para o
   * endereço (mais do que os `before` que já havia antes do pedido).
   */
  async function lastMailTo(email: string, before = 0): Promise<SentMail> {
    await vi.waitFor(() => {
      expect(mailsTo(email).length).toBeGreaterThan(before);
    });
    return mailsTo(email).at(-1) as SentMail;
  }

  function tokenOf(mail: SentMail): string {
    const token = /token=([A-Za-z0-9_-]{43})/.exec(mail.text)?.[1];
    expect(token).toBeDefined();
    return token as string;
  }

  async function requestReset(email: string): Promise<string> {
    const before = mailsTo(email).length;
    await t.request().post(REQUEST).send({ email }).expect(202);
    return tokenOf(await lastMailTo(email, before));
  }

  const login = (email: string, senha: string) =>
    t.request().post(LOGIN).send({ email, senha });

  describe('CA02/CA03 — solicitação e validação pelo e-mail cadastrado', () => {
    it('CA02: aceita o pedido e envia o link ao e-mail da conta', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(REQUEST)
        .send({ email })
        .expect(202);

      expect(response.body.mensagem).toMatch(/se houver uma conta/i);
      const mail = await lastMailTo(email);
      expect(mail.subject).toBe('Recuperação de acesso — Rede Cafuringa');
      // Rota por hash do app; o token fica depois do #: não vai ao servidor do
      // front nem no Referer.
      const link = /(\S+\/#\/nova-senha\?token=[A-Za-z0-9_-]{43})/.exec(
        mail.text,
      )?.[1];
      expect(link).toBeDefined();
      expect(link?.split('#')[0]).toBe('http://localhost:5173/');
    });

    it('CA02: ignora maiúsculas e espaços no e-mail', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);

      await t
        .request()
        .post(REQUEST)
        .send({ email: `  ${email.toUpperCase()} ` })
        .expect(202);

      await lastMailTo(email);
    });

    it('CA03: funciona para produtor e administrador (todos usam e-mail e senha, RN05)', async () => {
      const produtor = makeProducer();
      await t
        .request()
        .post('/api/v1/users/producers')
        .send(produtor)
        .expect(201);
      const admin = await seedUser(t, Role.ADMINISTRADOR);

      await requestReset(produtor.email);
      await requestReset(admin.email);
    });

    it('RNF11: a resposta nunca traz o token nem o e-mail', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(REQUEST)
        .send({ email })
        .expect(202);
      const token = tokenOf(await lastMailTo(email));

      const body = JSON.stringify(response.body);
      expect(body).not.toContain(token);
      expect(body).not.toContain(email);
    });

    it('RNF11: o banco guarda só o hash do token, nunca o token', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      const docs = await t.connection
        .collection('password_reset_tokens')
        .find()
        .toArray();

      expect(docs).toHaveLength(1);
      expect(JSON.stringify(docs)).not.toContain(token);
      expect(docs[0].tokenHash).toBe(
        createHash('sha256').update(token).digest('hex'),
      );
    });
  });

  describe('RNF11/RNF08 — sem enumeração de contas', () => {
    it('e-mail cadastrado e não cadastrado recebem exatamente a mesma resposta', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);

      const existente = await t.request().post(REQUEST).send({ email });
      const inexistente = await t
        .request()
        .post(REQUEST)
        .send({ email: 'fantasma@exemplo.com' });

      expect(inexistente.status).toBe(existente.status);
      expect(inexistente.body).toEqual(existente.body);
    });

    it('e-mail não cadastrado: nenhum e-mail enviado e nenhum token criado', async () => {
      await t
        .request()
        .post(REQUEST)
        .send({ email: 'fantasma@exemplo.com' })
        .expect(202);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(fakeMail.send).not.toHaveBeenCalled();
      expect(
        await t.connection.collection('password_reset_tokens').countDocuments(),
      ).toBe(0);
    });

    it('conta desativada: mesma resposta, sem e-mail', async () => {
      const { user, email } = await seedUser(t, Role.CONSUMIDOR);
      await t.connection
        .collection('users')
        .updateOne({ _id: user._id }, { $set: { ativo: false } });

      await t.request().post(REQUEST).send({ email }).expect(202);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(fakeMail.send).not.toHaveBeenCalled();
    });

    it('falha do provedor de e-mail não muda a resposta', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      fakeMail.send.mockRejectedValueOnce(new Error('SMTP fora'));

      await t.request().post(REQUEST).send({ email }).expect(202);
    });
  });

  describe('CA04 — validação do link', () => {
    it('link recém-enviado é válido', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      const response = await t
        .request()
        .post(VALIDATE)
        .send({ token })
        .expect(200);

      expect(response.body).toEqual({ valido: true });
    });

    it('validar não consome o link', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      await t.request().post(VALIDATE).send({ token }).expect(200);
      await t.request().post(VALIDATE).send({ token }).expect(200);
    });
  });

  describe('CA05 — definição da nova senha', () => {
    it('troca a senha: a nova entra e a antiga deixa de valer', async () => {
      const { email, senha } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      const response = await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      expect(response.body.mensagem).toMatch(/conclu/i);
      await login(email, NOVA_SENHA).expect(200);
      await login(email, senha).expect(401);
    });

    it('grava a senha como hash argon2id, nunca em texto', async () => {
      const { user, email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      const stored = await t.connection
        .collection('users')
        .findOne({ _id: user._id });
      expect(stored?.senhaHash).toMatch(/^\$argon2id\$/);
      expect(JSON.stringify(stored)).not.toContain(NOVA_SENHA);
    });

    it('não altera os demais dados da conta', async () => {
      const { user, email } = await seedUser(t, Role.CONSUMIDOR);
      const before = await t.connection
        .collection('users')
        .findOne({ _id: user._id });
      const token = await requestReset(email);

      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      const after = await t.connection
        .collection('users')
        .findOne({ _id: user._id });
      // Mudam só a senha e o marco da troca (que encerra sessões antigas).
      const strip = (doc: Record<string, unknown> | null) => {
        const {
          senhaHash: _hash,
          updatedAt: _updated,
          credenciaisAlteradasEm: _changed,
          ...rest
        } = doc ?? {};
        return rest;
      };
      expect(strip(after)).toEqual(strip(before));
      expect(after?.senhaHash).not.toBe(before?.senhaHash);
      expect(before?.credenciaisAlteradasEm).toBeUndefined();
      expect(after?.credenciaisAlteradasEm).toBeInstanceOf(Date);
    });

    it('depois de concluir, nenhum token da conta sobra', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      expect(
        await t.connection.collection('password_reset_tokens').countDocuments(),
      ).toBe(0);
    });

    it('o token vale uma única vez', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);
      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      const reuso = await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: 'OutraSenha789' })
        .expect(400);

      expect(reuso.body.message).toBe(INVALID_LINK);
      await login(email, NOVA_SENHA).expect(200);
      await t.request().post(VALIDATE).send({ token }).expect(400);
    });

    it('dois envios simultâneos do mesmo link: só um vence', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      const results = await Promise.all(
        ['SenhaAAA111', 'SenhaBBB222', 'SenhaCCC333', 'SenhaDDD444'].map(
          (novaSenha) => t.request().post(CONFIRM).send({ token, novaSenha }),
        ),
      );

      const statuses = results.map((r) => r.status).sort((a, b) => a - b);
      expect(statuses).toEqual([200, 400, 400, 400]);
    });

    it('um novo pedido invalida o link anterior', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const antigo = await requestReset(email);
      const novo = await requestReset(email);

      expect(novo).not.toBe(antigo);
      await t
        .request()
        .post(CONFIRM)
        .send({ token: antigo, novaSenha: NOVA_SENHA })
        .expect(400);
      await t
        .request()
        .post(CONFIRM)
        .send({ token: novo, novaSenha: NOVA_SENHA })
        .expect(200);
    });
  });

  describe('CA06 — solicitação inválida', () => {
    it.each([
      ['sem e-mail', {}],
      ['e-mail inválido', { email: 'nao-e-email' }],
      ['e-mail vazio', { email: '' }],
      ['e-mail como objeto', { email: { $ne: null } }],
      ['e-mail enorme', { email: `${'a'.repeat(300)}@exemplo.com` }],
    ])('pedido %s: 400 com mensagem', async (_nome, body) => {
      const response = await t.request().post(REQUEST).send(body).expect(400);

      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('token que nunca existiu: 400 orientativo', async () => {
      const response = await t
        .request()
        .post(CONFIRM)
        .send({ token: 'A'.repeat(43), novaSenha: NOVA_SENHA })
        .expect(400);

      expect(response.body.message).toBe(INVALID_LINK);
    });

    it('validação de token que nunca existiu: 400', async () => {
      const response = await t
        .request()
        .post(VALIDATE)
        .send({ token: 'A'.repeat(43) })
        .expect(400);

      expect(response.body.message).toBe(INVALID_LINK);
    });

    it.each([
      ['curta', 'Ab1'],
      ['sem número', 'SomenteLetras'],
      ['sem letra', '123456789'],
      ['longa demais', `A1${'x'.repeat(130)}`],
    ])(
      'senha %s: 400 e o link continua utilizável',
      async (_nome, novaSenha) => {
        const { email } = await seedUser(t, Role.CONSUMIDOR);
        const token = await requestReset(email);

        const response = await t
          .request()
          .post(CONFIRM)
          .send({ token, novaSenha })
          .expect(400);
        expect(Array.isArray(response.body.message)).toBe(true);

        await t
          .request()
          .post(CONFIRM)
          .send({ token, novaSenha: NOVA_SENHA })
          .expect(200);
      },
    );

    it('senha ausente: 400', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);

      await t.request().post(CONFIRM).send({ token }).expect(400);
    });

    it('link expirado: 400 e a senha não muda', async () => {
      const { email, senha } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);
      await t.connection
        .collection('password_reset_tokens')
        .updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

      const response = await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(400);

      expect(response.body.message).toBe(INVALID_LINK);
      await login(email, senha).expect(200);
    });

    it('conta desativada depois do pedido: o link deixa de funcionar', async () => {
      const { user, email } = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(email);
      await t.connection
        .collection('users')
        .updateOne({ _id: user._id }, { $set: { ativo: false } });

      await t.request().post(VALIDATE).send({ token }).expect(400);
      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(400);
    });

    it.each([
      ['objeto de operador', { $ne: null }],
      ['objeto com regex', { $regex: '.*' }],
      ['lista', ['a']],
      ['número', 123],
      ['nulo', null],
      ['ausente', undefined],
    ])('NoSQL injection: token como %s é recusado', async (_nome, token) => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      await requestReset(email);

      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(400);
      await t.request().post(VALIDATE).send({ token }).expect(400);
      await login(email, VALID_PASSWORD).expect(200);
    });
  });

  describe('RNF08 — a recuperação atua só na conta do titular do e-mail', () => {
    it('o token de uma conta não altera a senha de outra', async () => {
      const a = await seedUser(t, Role.CONSUMIDOR);
      const b = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(a.email);

      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      await login(a.email, NOVA_SENHA).expect(200);
      await login(b.email, b.senha).expect(200);
    });

    it('o corpo não aceita indicar a conta: campos extras são recusados', async () => {
      const a = await seedUser(t, Role.CONSUMIDOR);
      const b = await seedUser(t, Role.CONSUMIDOR);
      const token = await requestReset(a.email);

      await t
        .request()
        .post(CONFIRM)
        .send({
          token,
          novaSenha: NOVA_SENHA,
          email: b.email,
          userId: String(b.user._id),
        })
        .expect(400);

      await login(b.email, b.senha).expect(200);
    });

    it('rota pública: não exige login, e o JWT antigo não é necessário', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);
      await t.request().post(REQUEST).send({ email }).expect(202);
    });
  });

  describe('RNF08 — trocar a senha encerra as sessões abertas', () => {
    it('o JWT obtido antes da redefinição deixa de valer; um login novo funciona', async () => {
      const { email, senha } = await seedUser(t, Role.CONSUMIDOR);
      const antigo = (await login(email, senha).expect(200)).body
        .accessToken as string;
      await t
        .request()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${antigo}`)
        .expect(200);

      // O iat do JWT é em segundos: espera o segundo virar para a ordem ser inequívoca.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const token = await requestReset(email);
      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      const recusado = await t
        .request()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${antigo}`)
        .expect(401);
      expect(recusado.body.message).toBe(
        'Sessão encerrada. Faça login novamente.',
      );

      const novo = (await login(email, NOVA_SENHA).expect(200)).body
        .accessToken as string;
      await t
        .request()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${novo}`)
        .expect(200);
    });

    it('vale para rotas protegidas por perfil, não só para /auth/me', async () => {
      const admin = await seedUser(t, Role.ADMINISTRADOR);
      const antigo = forgeToken({
        sub: String(admin.user._id),
        perfil: Role.ADMINISTRADOR,
        iat: Math.floor(Date.now() / 1000) - 10,
      });
      const token = await requestReset(admin.email);
      await t
        .request()
        .post(CONFIRM)
        .send({ token, novaSenha: NOVA_SENHA })
        .expect(200);

      await t
        .request()
        .post('/api/v1/users/admins')
        .set('Authorization', `Bearer ${antigo}`)
        .send({ email: 'novo.admin@exemplo.com', senha: 'SenhaForte123' })
        .expect(401);
    });

    it('pedir a recuperação sem concluir não derruba a sessão', async () => {
      const { email, senha } = await seedUser(t, Role.CONSUMIDOR);
      const sessao = (await login(email, senha).expect(200)).body
        .accessToken as string;

      await requestReset(email);

      await t
        .request()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${sessao}`)
        .expect(200);
    });
  });

  it('o serviço de usuários continua achando a conta pelo e-mail (sem efeito colateral)', async () => {
    const { email } = await seedUser(t, Role.CONSUMIDOR);
    await requestReset(email);

    expect(await t.app.get(UsersService).findByEmail(email)).not.toBeNull();
  });
});
