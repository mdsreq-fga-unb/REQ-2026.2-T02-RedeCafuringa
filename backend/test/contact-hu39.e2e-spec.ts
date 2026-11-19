process.env.AUTH_THROTTLE_LIMIT = '1000';

import { Role } from '../src/modules/users/domain/role.js';
import { loginAs } from './utils/auth.js';
import {
  createProduct,
  registerProducer,
  samplePhoto,
} from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const API = '/api/v1';
const TRAJECTORY = `${API}/producers/me/trajectory`;

const AUTHORIZED_PHONE = '61988887777';
const PRIVATE_PHONE = '61977776666';

const experience = {
  nome: 'Trilha guiada da nascente',
  categoria: 'Experiência',
  descricao: 'Caminhada de 3 km até a nascente, com café da roça.',
  valorPorPessoa: '45',
  local: 'Sítio Boa Vista, Núcleo Rural Cafuringa',
  duracao: '2 horas',
};

/**
 * HU39/RF39 — Disponibilizar contato direto.
 *
 * O contato público do produtor vem do perfil público (`GET
 * /producers/{id}/trajectory`), que aplica `publicPhone` (RN07). Estes testes
 * provam que o número só sai da API com autorização, sem login (CA05), e que
 * nenhuma rota pública, nem uma revalidação de cache, devolve um número que
 * o produtor não autorizou ou deixou de autorizar (CA04, RNF11).
 */
describe('HU39 — contato direto pelo WhatsApp (e2e)', () => {
  let t: TestApp;
  let photo: Buffer;

  beforeAll(async () => {
    t = await createTestApp();
    photo = await samplePhoto();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  async function producer(
    telefone: string | undefined,
    telefonePublico: boolean,
  ) {
    const p = await registerProducer(t, telefone ? { telefone } : {});
    await publish(p.auth, telefonePublico);
    const product = await createProduct(t, p.auth, photo);
    let req = t
      .request()
      .post(`${API}/experiences`)
      .set('Authorization', p.auth);
    for (const [name, value] of Object.entries(experience))
      req = req.field(name, value);
    const created = await req.attach('fotos', photo, 'foto.jpg').expect(201);
    return {
      ...p,
      productId: product.id,
      experienceId: created.body.id as string,
    };
  }

  function publish(auth: string, telefonePublico: boolean) {
    return t
      .request()
      .put(TRAJECTORY)
      .set('Authorization', auth)
      .send({
        trajetoria: 'Nossa história na região.',
        telefonePublico,
      })
      .expect(200);
  }

  /** Todas as rotas públicas que mostram o produtor ou as ofertas dele. */
  function publicRoutes(p: {
    id: string;
    productId: string;
    experienceId: string;
  }) {
    return [
      `${API}/producers`,
      `${API}/producers/${p.id}/trajectory`,
      `${API}/products`,
      `${API}/products?busca=Cesta`,
      `${API}/products?produtor=${p.id}`,
      `${API}/products/${p.productId}`,
      `${API}/experiences`,
      `${API}/experiences?produtor=${p.id}`,
      `${API}/experiences/${p.experienceId}`,
    ];
  }

  it('CA01/CA02/CA03/CA05: visitante sem login recebe o contato autorizado', async () => {
    const p = await producer(AUTHORIZED_PHONE, true);

    const res = await t
      .request()
      .get(`${API}/producers/${p.id}/trajectory`)
      .expect(200);

    expect(res.body).toMatchObject({ id: p.id, telefone: AUTHORIZED_PHONE });
  });

  it('CA04/RNF11: número não autorizado não aparece em nenhuma resposta pública', async () => {
    const p = await producer(PRIVATE_PHONE, false);
    // Um segundo produtor autorizado garante que as listas não venham vazias.
    await producer(AUTHORIZED_PHONE, true);

    for (const route of publicRoutes(p)) {
      const res = await t.request().get(route).expect(200);
      expect(res.text, route).not.toContain(PRIVATE_PHONE);
    }
    const profile = await t
      .request()
      .get(`${API}/producers/${p.id}/trajectory`)
      .expect(200);
    expect(profile.body).not.toHaveProperty('telefone');
  });

  it('CA04: ofertas nunca carregam telefone, nem o autorizado (vem só do perfil)', async () => {
    const p = await producer(AUTHORIZED_PHONE, true);

    for (const route of publicRoutes(p).filter(
      (r) => !r.includes('/producers'),
    )) {
      const res = await t.request().get(route).expect(200);
      expect(res.text, route).not.toContain(AUTHORIZED_PHONE);
      expect(res.text, route).not.toContain('telefone');
    }
  });

  it('CA06: produtor sem telefone não tem contato no perfil público', async () => {
    const p = await producer(undefined, true);

    const res = await t
      .request()
      .get(`${API}/producers/${p.id}/trajectory`)
      .expect(200);

    expect(res.body).not.toHaveProperty('telefone');
  });

  it('CA03/CA04: revogar a autorização vale na hora, inclusive para quem revalida o cache (ETag)', async () => {
    const p = await producer(AUTHORIZED_PHONE, true);
    const route = `${API}/producers/${p.id}/trajectory`;

    const before = await t.request().get(route).expect(200);
    expect(before.body.telefone).toBe(AUTHORIZED_PHONE);
    const etag = before.headers.etag as string;
    expect(etag).toBeTruthy();
    // Resposta pública com dado pessoal não pode ficar em cache compartilhado
    // nem ser reaproveitada sem revalidar.
    expect(before.headers['cache-control'] ?? '').not.toMatch(
      /max-age=[1-9]|immutable|s-maxage/,
    );

    await publish(p.auth, false);

    // Sem mudança, a revalidação devolve 304 (prova de que o ETag funciona)...
    const unchanged = await t.request().get(`${API}/producers`).expect(200);
    await t
      .request()
      .get(`${API}/producers`)
      .set('If-None-Match', unchanged.headers.etag as string)
      .expect(304);
    // ...e, depois da revogação, o ETag antigo não serve mais: volta 200 sem o número.
    const after = await t
      .request()
      .get(route)
      .set('If-None-Match', etag)
      .expect(200);
    expect(after.body).not.toHaveProperty('telefone');
    expect(after.text).not.toContain(AUTHORIZED_PHONE);
    expect(after.headers.etag).not.toBe(etag);
  });

  it('CA03/RNF08: só o próprio produtor muda a autorização; visitante e consumidor não', async () => {
    const owner = await producer(PRIVATE_PHONE, false);
    const consumer = await loginAs(t, Role.CONSUMIDOR);
    const change = { trajetoria: 'Outra história.', telefonePublico: true };

    await t.request().put(TRAJECTORY).send(change).expect(401);
    await t
      .request()
      .put(TRAJECTORY)
      .set('Authorization', `Bearer ${consumer}`)
      .send(change)
      .expect(403);
    // Outro produtor grava a própria conta (o dono vem do token), nunca a alheia.
    const other = await producer(AUTHORIZED_PHONE, false);
    await t
      .request()
      .put(TRAJECTORY)
      .set('Authorization', other.auth)
      .send(change)
      .expect(200);

    const res = await t
      .request()
      .get(`${API}/producers/${owner.id}/trajectory`)
      .expect(200);
    expect(res.body).not.toHaveProperty('telefone');
    expect(res.text).not.toContain(PRIVATE_PHONE);
  });
});
