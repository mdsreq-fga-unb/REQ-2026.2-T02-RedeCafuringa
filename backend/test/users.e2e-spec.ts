// Este arquivo cadastra muitos usuários; o limite de autenticação é testado à parte.
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeConsumer } from '@test/factories';
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

    it('400 quando falta campo obrigatório (RN02)', async () => {
      const { telefone: _telefone, ...dto } = makeConsumer();

      await t.request().post(REGISTER).send(dto).expect(400);
    });

    it('RN01: não permite escolher o perfil pelo payload', async () => {
      await t
        .request()
        .post(REGISTER)
        .send(Object.assign(makeConsumer(), { perfil: 'ADMINISTRADOR' }))
        .expect(400);
    });
  });

  it('RN15/RNF15: recusa menor de 18 anos com 400', async () => {
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
});
