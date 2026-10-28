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

  describe('POST /auth/login (RN08: CPF e senha)', () => {
    it('autentica com CPF e senha e devolve token Bearer (200)', async () => {
      const { cpf, senha, user } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(LOGIN)
        .send({ cpf, senha })
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

    it('aceita CPF com máscara', async () => {
      const { cpf, senha } = await seedUser(t, Role.CONSUMIDOR);
      const masked = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

      await t.request().post(LOGIN).send({ cpf: masked, senha }).expect(200);
    });

    it('RNF11: o token não carrega CPF, e-mail nem nome', async () => {
      const { cpf, senha, user } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(LOGIN)
        .send({ cpf, senha })
        .expect(200);
      const payload = JSON.parse(
        Buffer.from(
          (response.body.accessToken as string).split('.')[1],
          'base64url',
        ).toString(),
      );

      expect(Object.keys(payload).sort()).toEqual([
        'exp',
        'iat',
        'perfil',
        'sub',
      ]);
      expect(payload.sub).toBe(user.id);
    });

    it('recusa senha errada com 401 e mensagem genérica', async () => {
      const { cpf } = await seedUser(t, Role.CONSUMIDOR);

      const response = await t
        .request()
        .post(LOGIN)
        .send({ cpf, senha: 'SenhaErrada999' })
        .expect(401);

      expect(response.body.message).toBe('CPF ou senha inválidos');
    });

    it('recusa CPF não cadastrado com a mesma resposta (sem enumeração)', async () => {
      const response = await t
        .request()
        .post(LOGIN)
        .send({ cpf: '52998224725', senha: 'SenhaForte123' })
        .expect(401);

      expect(response.body.message).toBe('CPF ou senha inválidos');
    });

    it('recusa conta desativada com 403', async () => {
      const { cpf, senha, user } = await seedUser(t, Role.CONSUMIDOR);
      await t.connection
        .collection('users')
        .updateOne(
          { _id: new Types.ObjectId(user.id) },
          { $set: { ativo: false } },
        );

      await t.request().post(LOGIN).send({ cpf, senha }).expect(403);
    });

    it.each([
      ['sem senha', { cpf: '52998224725' }],
      ['CPF inválido', { cpf: '123', senha: 'SenhaForte123' }],
      ['campo extra', { cpf: '52998224725', senha: 'x', admin: true }],
    ])('RNF03: 400 para payload %s', async (_caso, body) => {
      await t.request().post(LOGIN).send(body).expect(400);
    });
  });

  describe('GET /auth/me (acessar funcionalidades do meu perfil)', () => {
    it('devolve o perfil do usuário autenticado sem dados sensíveis', async () => {
      const { cpf, senha, user } = await seedUser(t, Role.PRODUTOR);
      const login = await t.request().post(LOGIN).send({ cpf, senha });

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
