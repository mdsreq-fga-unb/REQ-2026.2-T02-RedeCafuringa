process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeProducer } from '@test/factories';
import { createTestApp, TestApp } from './utils/test-app.js';

const PRODUCER_REGISTER = '/api/v1/users/producers';

describe('HU02 — telefone do produtor (e2e)', () => {
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

  it('grava e devolve o telefone informado', async () => {
    const dto = makeProducer({ telefone: '61999990000' });

    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(dto)
      .expect(201);

    expect(response.body.telefone).toBe('61999990000');
    const stored = await t.connection
      .collection('users')
      .findOne({ email: dto.email });
    expect(stored?.telefone).toBe('61999990000');
  });

  it('aceita cadastro sem telefone e não devolve o campo', async () => {
    const response = await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer())
      .expect(201);

    expect(response.body).not.toHaveProperty('telefone');
  });

  it('400 para telefone fora do formato', async () => {
    await t
      .request()
      .post(PRODUCER_REGISTER)
      .send(makeProducer({ telefone: '123' }))
      .expect(400);
  });
});
