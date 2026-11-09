// Este arquivo faz muitos logins; o limite de autenticação é testado à parte.
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { Types } from 'mongoose';
import { Role } from '../src/modules/users/domain/role.js';
import { forgeToken, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const LOGIN = '/api/v1/auth/login';
const ME = '/api/v1/auth/me';

describe('HU09 — Realizar login para acessar o meu perfil (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  describe('POST /auth/login (RN05: e-mail e senha)', () => {
    it('autentica com e-mail e senha e devolve token Bearer (200)', async () => {
      const { email, senha, user } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(LOGIN)
        .send({ email, senha })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        usuario: expect.objectContaining({
          id: user.id,
          perfil: 'CONSUMIDOR',
        }),
      });
    });

    it('ignora maiúsculas no e-mail', async () => {
      const { email, senha } = await seedUser(t, Role.CONSUMIDOR);

      await t
        .request()
        .post(LOGIN)
        .send({ email: email.toUpperCase(), senha })
        .expect(200);
    });

    it('RN05: CPF não é credencial de acesso (400)', async () => {
      const { cpf, senha } = await seedUser(t, Role.CONSUMIDOR);

      await t.request().post(LOGIN).send({ cpf, senha }).expect(400);
    });

    it('RNF11: o token não carrega CPF, e-mail nem nome', async () => {
      const { email, senha, user } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(LOGIN)
        .send({ email, senha })
        .expect(200);
      const payload = JSON.parse(
        Buffer.from(
          (response.body.accessToken as string).split('.')[1],
          'base64url',
        ).toString(),
      );

      // `sat` (HU10) é só o instante do login em ms, base da revogação.
      expect(Object.keys(payload).sort()).toEqual([
        'exp',
        'iat',
        'perfil',
        'sat',
        'sub',
      ]);
      expect(payload.sub).toBe(user.id);
      expect(typeof payload.sat).toBe('number');
    });

    it('recusa senha errada com 401 e mensagem genérica', async () => {
      const { email } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(LOGIN)
        .send({ email, senha: 'SenhaErrada999' })
        .expect(401);

      expect(response.body.message).toBe('E-mail ou senha inválidos');
    });

    it('recusa e-mail não cadastrado com a mesma resposta (sem enumeração)', async () => {
      const response = await t
        .request()
        .post(LOGIN)
        .send({ email: 'nao.existe@exemplo.com', senha: 'SenhaForte123' })
        .expect(401);

      expect(response.body.message).toBe('E-mail ou senha inválidos');
    });

    it('recusa conta desativada com 403', async () => {
      const { email, senha, user } = await seedUser(t, Role.CONSUMIDOR);
      await t.connection
        .collection('users')
        .updateOne(
          { _id: new Types.ObjectId(user.id) },
          { $set: { ativo: false } },
        );

      await t.request().post(LOGIN).send({ email, senha }).expect(403);
    });

    it.each([
      ['sem senha', { email: 'maria@exemplo.com' }],
      ['e-mail inválido', { email: 'sem-arroba', senha: 'SenhaForte123' }],
      ['campo extra', { email: 'maria@exemplo.com', senha: 'x', admin: true }],
    ])('RNF03: 400 para payload %s', async (_caso, body) => {
      await t.request().post(LOGIN).send(body).expect(400);
    });
  });

  describe('GET /auth/me (acessar funcionalidades do meu perfil)', () => {
    it('devolve o perfil do usuário autenticado sem dados sensíveis', async () => {
      const { email, senha, user } = await seedUser(t, Role.PRODUTOR);
      const login = await t.request().post(LOGIN).send({ email, senha });

      const response = await t
        .request()
        .get(ME)
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({ id: user.id, perfil: 'PRODUTOR' });
      expect(response.body.cpf).toMatch(/^\*\*\*\./);
      expect(response.body).not.toHaveProperty('senhaHash');
      expect(response.body).not.toHaveProperty('cpfHash');
      expect(response.body).not.toHaveProperty('cpfCifrado');
    });

    it('401 sem token', async () => {
      await t.request().get(ME).expect(401);
    });

    it('401 com token malformado', async () => {
      await t
        .request()
        .get(ME)
        .set('Authorization', 'Bearer nao.e.jwt')
        .expect(401);
    });

    it('401 com token expirado', async () => {
      const { user } = await seedUser(t, Role.CONSUMIDOR);
      const token = forgeToken(
        { sub: user.id, perfil: 'CONSUMIDOR' },
        { expiresIn: -60 },
      );

      await t
        .request()
        .get(ME)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('401 com token assinado por outro segredo', async () => {
      const { user } = await seedUser(t, Role.CONSUMIDOR);
      const token = forgeToken(
        { sub: user.id, perfil: 'ADMINISTRADOR' },
        { secret: 'segredo-de-um-atacante-com-32-chars!!' },
      );

      await t
        .request()
        .get(ME)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('401 com token sem assinatura (alg "none")', async () => {
      const { user } = await seedUser(t, Role.CONSUMIDOR);
      const token = forgeToken(
        { sub: user.id, perfil: 'ADMINISTRADOR' },
        { alg: 'none' },
      );

      await t
        .request()
        .get(ME)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('RNF08: conta desativada perde o acesso também nas rotas por perfil, mesmo com token válido', async () => {
      const { email, senha, user } = await seedUser(t, Role.ADMINISTRADOR);
      const login = await t.request().post(LOGIN).send({ email, senha });
      await t.connection
        .collection('users')
        .updateOne({ _id: user._id }, { $set: { ativo: false } });

      await t
        .request()
        .post('/api/v1/users/admins')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ email: 'outro.admin@exemplo.com', senha: 'SenhaForte123' })
        .expect(401);
    });

    it('RNF08: token com perfil diferente do atual da conta é recusado', async () => {
      const { user } = await seedUser(t, Role.CONSUMIDOR);
      const token = forgeToken({ sub: user.id, perfil: 'ADMINISTRADOR' });

      await t
        .request()
        .post('/api/v1/users/admins')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'outro.admin@exemplo.com', senha: 'SenhaForte123' })
        .expect(401);
    });

    it('401 quando a conta do token não existe mais', async () => {
      const token = forgeToken({
        sub: new Types.ObjectId().toHexString(),
        perfil: 'CONSUMIDOR',
      });

      await t
        .request()
        .get(ME)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
