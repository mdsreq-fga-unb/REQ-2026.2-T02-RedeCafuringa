// Este arquivo cadastra muitos usuários; o limite de autenticação é testado à parte.
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeConsumer, makeProducer } from '@test/factories';
import { Role } from '../src/modules/users/domain/role.js';
import { loginAs, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const REGISTER = '/api/v1/users/consumers';

describe('HU01 — Cadastrar perfil de consumidor (e2e)', () => {
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

  it('CA01/CA03: cria o perfil de consumidor e informa a conclusão (201)', async () => {
    const dto = makeConsumer();

    const response = await t.request().post(REGISTER).send(dto).expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      nome: dto.nome,
      email: dto.email,
      telefone: dto.telefone,
      perfil: 'CONSUMIDOR',
      cpf: expect.stringMatching(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/),
    });
  });

  it('RF01: aceita cadastro sem telefone', async () => {
    const { nome, cpf, email, senha, dataNascimento } = makeConsumer();

    const response = await t
      .request()
      .post(REGISTER)
      .send({ nome, cpf, email, senha, dataNascimento })
      .expect(201);

    expect(response.body).not.toHaveProperty('telefone');
  });

  it('RF01: telefone em branco equivale a não informado', async () => {
    const response = await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ telefone: '' }))
      .expect(201);

    expect(response.body).not.toHaveProperty('telefone');
  });

  it('aceita CPF com máscara', async () => {
    await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ cpf: '529.982.247-25' }))
      .expect(201);
  });

  it('RNF11: não persiste CPF nem senha em texto puro', async () => {
    const dto = makeConsumer();
    await t.request().post(REGISTER).send(dto).expect(201);

    const [stored] = await t.connection.collection('users').find().toArray();
    const raw = JSON.stringify(stored);

    expect(raw).not.toContain(dto.cpf);
    expect(raw).not.toContain(dto.senha);
    expect(stored.senhaHash).toMatch(/^\$argon2id\$/);
  });

  describe('CA02: valida os dados antes de concluir o cadastro (RNF03)', () => {
    it.each([
      ['nome', { nome: '' }],
      ['CPF inválido', { cpf: '529.982.247-26' }],
      ['e-mail inválido', { email: 'nao-e-email' }],
      ['telefone inválido', { telefone: 'abc' }],
      ['data de nascimento inválida', { dataNascimento: '10/05/1990' }],
      ['senha curta', { senha: 'Ab1' }],
      ['senha sem número', { senha: 'SomenteLetras' }],
      ['senha sem letra', { senha: '1234567890' }],
    ])('400 para %s, com mensagem', async (_caso, override) => {
      const response = await t
        .request()
        .post(REGISTER)
        .send(makeConsumer(override))
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.any(String)]),
      );
    });

    it.each(['email', 'dataNascimento'] as const)(
      '400 quando falta campo obrigatório: %s (RF01, RNF15)',
      async (campo) => {
        const { [campo]: _omitido, ...dto } = makeConsumer();

        await t.request().post(REGISTER).send(dto).expect(400);
      },
    );

    it('RN01: não permite escolher o perfil pelo payload', async () => {
      await t
        .request()
        .post(REGISTER)
        .send(Object.assign(makeConsumer(), { perfil: 'ADMINISTRADOR' }))
        .expect(400);
    });
  });

  it('RNF15: recusa menor de 18 anos com 400', async () => {
    const year = new Date().getUTCFullYear() - 17;

    const response = await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ dataNascimento: `${year}-01-01` }))
      .expect(400);

    expect(response.body.message).toContain('18 anos');
  });

  it('recusa CPF já cadastrado com 409, com ou sem máscara', async () => {
    await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ cpf: '52998224725' }))
      .expect(201);

    const response = await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ cpf: '529.982.247-25' }))
      .expect(409);

    expect(response.body.message).toBe('CPF já cadastrado');
  });

  it('CA03: recusa e-mail já cadastrado com 409 e mensagem de e-mail', async () => {
    await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ email: 'maria@exemplo.com' }))
      .expect(201);

    const response = await t
      .request()
      .post(REGISTER)
      .send(makeConsumer({ email: 'MARIA@exemplo.com' }))
      .expect(409);

    expect(response.body.message).toBe('E-mail já cadastrado');
  });
});

const PRODUCER_REGISTER = '/api/v1/users/producers';

describe('HU02 — Cadastrar perfil de produtor (e2e)', () => {
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

  it('CA01/CA09: cria o produtor e confirma a conclusão (201)', async () => {
    const dto = makeProducer();
    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(dto)
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      nome: dto.nomeResponsavel,
      nomeIniciativa: dto.nomeIniciativa,
      nomeResponsavel: dto.nomeResponsavel,
      email: dto.email,
      localidade: dto.localidade,
      categoriaOfertada: dto.categoriaOfertada,
      formasPagamento: dto.formasPagamento,
      perfil: 'PRODUTOR',
      cpf: expect.stringMatching(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/),
    });
  });

  it('CA02/CA03: aceita cadastro sem CNPJ', async () => {
    await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ cnpj: undefined }))
      .expect(201);
  });

  it('RNF11: não persiste CPF, CNPJ nem senha em texto puro', async () => {
    const dto = makeProducer();
    await t.request().post(PRODUCER_REGISTER).send(dto).expect(201);

    const [stored] = await t.connection.collection('users').find().toArray();
    const raw = JSON.stringify(stored);

    expect(raw).not.toContain(dto.cpf);
    expect(raw).not.toContain(dto.cnpj);
    expect(raw).not.toContain(dto.senha);
    expect(stored.senhaHash).toMatch(/^\$argon2id\$/);
  });

  it.each([
    ['nome da iniciativa vazio', { nomeIniciativa: '' }],
    ['responsável vazio', { nomeResponsavel: '' }],
    ['CPF inválido', { cpf: '529.982.247-26' }],
    ['CNPJ inválido', { cnpj: '11.222.333/0001-82' }],
    ['localidade vazia', { localidade: '' }],
    ['categoria inválida', { categoriaOfertada: 'Hortaliças' }],
    ['formas vazias', { formasPagamento: [] }],
    ['e-mail inválido', { email: 'nao-e-email' }],
    ['senha curta', { senha: 'Ab1' }],
    ['senha sem número', { senha: 'SomenteLetras' }],
    ['senha sem letra', { senha: '1234567890' }],
  ])('CA04/CA05: 400 para %s', async (_case, override) => {
    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer(override as never))
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
  });

  it('CA04: 400 quando falta campo obrigatório', async () => {
    const { localidade: _localidade, ...dto } = makeProducer();
    await t.request().post(PRODUCER_REGISTER).send(dto).expect(400);
  });

  it('RN01: não permite escolher perfil pelo payload', async () => {
    await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(Object.assign(makeProducer(), { perfil: 'ADMINISTRADOR' }))
      .expect(400);
  });

  it('CA06: 409 para e-mail duplicado', async () => {
    const dto = makeProducer({ email: 'produtor@exemplo.com' });
    await t.request().post(PRODUCER_REGISTER).send(dto).expect(201);

    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ email: 'PRODUTOR@EXEMPLO.COM' }))
      .expect(409);

    expect(response.body.message).toBe('E-mail já cadastrado');
  });

  it('CA07: 409 para CPF duplicado', async () => {
    await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ cpf: '52998224725' }))
      .expect(201);

    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ cpf: '529.982.247-25' }))
      .expect(409);

    expect(response.body.message).toBe('CPF já cadastrado');
  });

  it('CA07: 409 para CNPJ duplicado', async () => {
    await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ cnpj: '11222333000181' }))
      .expect(201);

    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ cnpj: '11.222.333/0001-81' }))
      .expect(409);

    expect(response.body.message).toBe('CNPJ já cadastrado');
  });
});

const ADMIN_REGISTER = '/api/v1/users/admins';
const LOGIN = '/api/v1/auth/login';

describe('HU03 — Cadastrar usuário administrador (e2e)', () => {
  let t: TestApp;
  let adminToken: string;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.clearDatabase();
    adminToken = await loginAs(t, Role.ADMINISTRADOR);
  });

  afterAll(async () => {
    await t?.close();
  });

  function register(body: object, token = adminToken) {
    return t
      .request()
      .post(ADMIN_REGISTER)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  it('CA01/CA05/CA07: administrador autenticado cria outra conta ADMINISTRADOR (201)', async () => {
    const response = await register({
      email: 'novo.admin@exemplo.com',
      senha: 'SenhaForte123',
    }).expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'novo.admin@exemplo.com',
      perfil: 'ADMINISTRADOR',
    });
  });

  it('RNF11: a resposta e o banco não expõem senha nem hash', async () => {
    const response = await register({
      email: 'novo.admin@exemplo.com',
      senha: 'SenhaForte123',
    }).expect(201);

    expect(JSON.stringify(response.body)).not.toMatch(/senha|hash|SenhaForte/i);
    const stored = await t.connection
      .collection('users')
      .findOne({ email: 'novo.admin@exemplo.com' });
    expect(stored?.senhaHash).toMatch(/^\$argon2/);
    expect(stored).not.toHaveProperty('cpfHash');
  });

  it('CA06: a conta criada entra com e-mail e senha e tem perfil ADMINISTRADOR', async () => {
    await register({
      email: 'novo.admin@exemplo.com',
      senha: 'SenhaForte123',
    }).expect(201);

    const login = await t
      .request()
      .post(LOGIN)
      .send({ email: 'novo.admin@exemplo.com', senha: 'SenhaForte123' })
      .expect(200);
    expect(login.body.usuario.perfil).toBe('ADMINISTRADOR');

    const me = await t
      .request()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(me.body).toMatchObject({
      email: 'novo.admin@exemplo.com',
      perfil: 'ADMINISTRADOR',
    });
    expect(me.body).not.toHaveProperty('cpf');
  });

  it('CA04: e-mail repetido (qualquer caixa) devolve 409', async () => {
    await register({ email: 'dup@exemplo.com', senha: 'SenhaForte123' }).expect(
      201,
    );

    const response = await register({
      email: 'DUP@exemplo.com',
      senha: 'SenhaForte123',
    }).expect(409);

    expect(response.body.message).toBe('E-mail já cadastrado');
  });

  it('CA04: e-mail de consumidor existente também é recusado', async () => {
    const { user } = await seedUser(t, Role.CONSUMIDOR);
    const email = (user as unknown as { email: string }).email;

    await register({ email, senha: 'SenhaForte123' }).expect(409);
  });

  it.each([
    ['sem campos', {}],
    ['sem senha', { email: 'a@exemplo.com' }],
    ['sem e-mail', { senha: 'SenhaForte123' }],
    ['e-mail inválido', { email: 'sem-arroba', senha: 'SenhaForte123' }],
    ['senha fraca', { email: 'a@exemplo.com', senha: '123' }],
    [
      'perfil injetado',
      { email: 'a@exemplo.com', senha: 'SenhaForte123', perfil: 'CONSUMIDOR' },
    ],
  ])('CA02/CA03: 400 para payload %s', async (_caso, body) => {
    await register(body).expect(400);
  });

  it('RN01/RN03: 401 sem token', async () => {
    await t
      .request()
      .post(ADMIN_REGISTER)
      .send({ email: 'a@exemplo.com', senha: 'SenhaForte123' })
      .expect(401);
  });

  it.each([Role.CONSUMIDOR, Role.PRODUTOR])(
    'RN03/RNF08: 403 para perfil %s e nada é gravado',
    async (perfil) => {
      const token = await loginAs(t, perfil);

      await register(
        { email: 'invasor@exemplo.com', senha: 'SenhaForte123' },
        token,
      ).expect(403);

      expect(
        await t.connection
          .collection('users')
          .countDocuments({ email: 'invasor@exemplo.com' }),
      ).toBe(0);
    },
  );
});
