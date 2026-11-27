// E-mail e CPF são únicos por perfil (a mesma pessoa pode ser consumidora e
// produtora). Bancos anteriores têm os índices únicos globais: a sincronização
// troca os dois. Administrador não tem CPF: o índice só considera quem tem.
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeConsumer, makeCpf, makeProducer } from '@test/factories';
import { Role } from '../src/modules/users/domain/role.js';
import { syncIndexes } from '../src/database/sync-indexes.js';
import { loginAs } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

describe('Sincronização de índices (e-mail e CPF por perfil)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  async function index(name: string) {
    const indexes = await t.connection.collection('users').indexes();
    return indexes.find((item) => item.name === name);
  }

  it('troca os índices únicos globais de e-mail e CPF pelos índices por perfil', async () => {
    const users = t.connection.collection('users');
    // O autoIndex do Mongoose é assíncrono: espera terminar antes de trocar o índice.
    await Promise.all(Object.values(t.connection.models).map((m) => m.init()));
    // Banco de antes da mudança: e-mail e CPF únicos na base inteira.
    await users.dropIndex('email_1_perfil_1');
    await users.dropIndex('cpfHash_1_perfil_1');
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ cpfHash: 1 }, { unique: true, sparse: true });

    const cpf = makeCpf();
    const email = 'maria@exemplo.com';
    const consumer = () =>
      t
        .request()
        .post('/api/v1/users/consumers')
        .send(makeConsumer({ cpf, email }));
    const producer = () =>
      t
        .request()
        .post('/api/v1/users/producers')
        .send(makeProducer({ cpf, email }));
    await consumer().expect(201);
    // Com o índice antigo, a conta de produtora da mesma pessoa colide.
    await producer().expect(409);

    await syncIndexes(t.connection);

    expect(await index('email_1')).toBeUndefined();
    expect(await index('cpfHash_1')).toBeUndefined();
    expect((await index('email_1_perfil_1'))?.unique).toBe(true);
    expect(await index('cpfHash_1_perfil_1')).toMatchObject({
      unique: true,
      partialFilterExpression: { cpfHash: { $exists: true } },
    });
    await producer().expect(201);
  });

  it('libera vários administradores sem CPF', async () => {
    const token = await loginAs(t, Role.ADMINISTRADOR);
    const create = (email: string) =>
      t
        .request()
        .post('/api/v1/users/admins')
        .set('Authorization', `Bearer ${token}`)
        .send({ email, senha: 'SenhaForte123' });

    await create('a1@exemplo.com').expect(201);
    await create('a2@exemplo.com').expect(201);
  });

  it('é idempotente e mantém os administradores existentes', async () => {
    await syncIndexes(t.connection);
    await syncIndexes(t.connection);

    const token = await loginAs(t, Role.ADMINISTRADOR);
    await t
      .request()
      .post('/api/v1/users/admins')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'a4@exemplo.com', senha: 'SenhaForte123' })
      .expect(201);
  });
});
