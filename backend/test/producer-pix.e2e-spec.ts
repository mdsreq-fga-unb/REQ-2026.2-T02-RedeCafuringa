process.env.AUTH_THROTTLE_LIMIT = '1000';

import { registerProducer } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const ME = '/api/v1/producers/me/trajectory';
const TRAJETORIA = 'Começamos a plantar café em 1990, no Núcleo Rural.';

const pix = {
  tipo: 'cpf',
  chave: '529.982.247-25',
  nomeRecebedor: 'Maria da Silva',
  publico: true,
};

describe('Trajetória — chave Pix da produtora (e2e)', () => {
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

  const save = (auth: string, body: Record<string, unknown>) =>
    t.request().put(ME).set('Authorization', auth).send(body);
  const own = (auth: string) =>
    t.request().get(ME).set('Authorization', auth).expect(200);

  it('salva a chave normalizada e mostra só para a própria produtora', async () => {
    const { id, auth } = await registerProducer(t);

    const saved = await save(auth, { trajetoria: TRAJETORIA, pix }).expect(200);

    expect(saved.body.pix).toMatchObject({
      tipo: 'cpf',
      chave: '52998224725',
      nomeRecebedor: 'Maria da Silva',
      publico: true,
    });
    expect((await own(auth)).body.pix.chave).toBe('52998224725');
    const profile = await t
      .request()
      .get(`/api/v1/producers/${id}/trajectory`)
      .expect(200);
    const list = await t.request().get('/api/v1/producers').expect(200);
    for (const body of [profile.body, list.body])
      expect(JSON.stringify(body)).not.toContain('52998224725');
  });

  it('salvar sem o campo mantém o Pix; com null, remove', async () => {
    const { auth } = await registerProducer(t);
    await save(auth, { trajetoria: TRAJETORIA, pix }).expect(200);

    await save(auth, { trajetoria: 'História revista.' }).expect(200);
    expect((await own(auth)).body.pix.chave).toBe('52998224725');

    await save(auth, { trajetoria: 'História revista.', pix: null }).expect(
      200,
    );
    expect((await own(auth)).body).not.toHaveProperty('pix');
  });

  it('chave que não combina com o tipo: 400 com a orientação e nada muda', async () => {
    const { auth } = await registerProducer(t);
    await save(auth, { trajetoria: TRAJETORIA, pix }).expect(200);

    const res = await save(auth, {
      trajetoria: TRAJETORIA,
      // Um CPF pode até parecer celular; como e-mail, nunca combina.
      pix: { ...pix, tipo: 'email' },
    }).expect(400);

    expect(res.body.message).toEqual([
      'Chave Pix inválida para o tipo escolhido',
    ]);
    expect((await own(auth)).body.pix.tipo).toBe('cpf');
  });
});
