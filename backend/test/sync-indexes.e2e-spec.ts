// Cadastros de administrador não têm CPF: o índice único de cpfHash precisa ser
// esparso. Bancos criados antes da HU03 têm o índice antigo (não esparso).
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { Role } from '../src/modules/users/domain/role.js';
import { syncIndexes } from '../src/database/sync-indexes.js';
import { loginAs } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

describe('Sincronização de índices (HU03, migração do índice de cpfHash)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  async function cpfHashIndex() {
    const indexes = await t.connection.collection('users').indexes();
    return indexes.find((index) => index.name === 'cpfHash_1');
  }

  it('troca o índice antigo (não esparso) pelo esparso e libera vários administradores sem CPF', async () => {
    const users = t.connection.collection('users');
    // O autoIndex do Mongoose é assíncrono: espera terminar antes de trocar o índice.
    await Promise.all(Object.values(t.connection.models).map((m) => m.init()));
    await users.dropIndex('cpfHash_1');
    await users.createIndex({ cpfHash: 1 }, { unique: true });
    expect((await cpfHashIndex())?.sparse).toBeUndefined();

    const token = await loginAs(t, Role.ADMINISTRADOR);
    const create = (email: string) =>
      t
        .request()
        .post('/api/v1/users/admins')
        .set('Authorization', `Bearer ${token}`)
        .send({ email, senha: 'SenhaForte123' });
    await create('a1@exemplo.com').expect(201);
    // Com o índice antigo, o segundo administrador sem CPF colide em "null".
    await create('a2@exemplo.com').expect(500);

    await syncIndexes(t.connection);

    expect((await cpfHashIndex())?.sparse).toBe(true);
    expect((await cpfHashIndex())?.unique).toBe(true);
  });

  it('é idempotente e mantém os administradores existentes', async () => {
    await syncIndexes(t.connection);
    await syncIndexes(t.connection);

    const token = await loginAs(t, Role.ADMINISTRADOR);
    await t
      .request()
      .post('/api/v1/users/admins')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'a3@exemplo.com', senha: 'SenhaForte123' })
      .expect(201);
  });
});
