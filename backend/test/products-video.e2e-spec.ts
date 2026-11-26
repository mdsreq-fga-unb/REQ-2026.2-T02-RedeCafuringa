process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getModelToken } from '@nestjs/mongoose';
import { makeProducer } from '@test/factories';
import type { Model } from 'mongoose';
import sharp from 'sharp';
import { VIDEO_URL_ERROR } from '../src/common/video/youtube.js';
import { Product } from '../src/modules/products/schemas/product.schema.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const PRODUCTS = '/api/v1/products';
const ID = 'dQw4w9WgXcQ';

const valid = {
  nome: 'Queijo minas',
  categoria: 'Produtos',
  descricao: 'Queijo curado no sítio.',
  precoPorUnidade: '30',
  gramasPorUnidade: '500',
};

describe('Produto — vídeo do YouTube (e2e)', () => {
  let t: TestApp;
  let jpeg: Buffer;

  beforeAll(async () => {
    t = await createTestApp();
    jpeg = await sharp({
      create: { width: 200, height: 150, channels: 3, background: '#3a6' },
    })
      .jpeg()
      .toBuffer();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  async function producerAuth() {
    const dto = makeProducer();
    await t.request().post('/api/v1/users/producers').send(dto).expect(201);
    const login = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email: dto.email, senha: dto.senha })
      .expect(200);
    return `Bearer ${login.body.accessToken as string}`;
  }

  function post(auth: string, fields: Record<string, string>) {
    let req = t.request().post(PRODUCTS).set('Authorization', auth);
    for (const [name, value] of Object.entries(fields))
      req = req.field(name, value);
    return req.attach('fotos', jpeg, 'foto.jpg');
  }

  const products = () => t.app.get<Model<Product>>(getModelToken(Product.name));

  it('cadastra com o link e guarda só o id do vídeo', async () => {
    const auth = await producerAuth();

    const res = await post(auth, {
      ...valid,
      videoUrl: `https://youtu.be/${ID}?si=abc`,
    }).expect(201);

    expect(res.body.videoId).toBe(ID);
    const saved = await products().findById(res.body.id).lean();
    expect(saved).toMatchObject({ videoId: ID });
    expect(saved).not.toHaveProperty('videoUrl');
  });

  it('sem link, cadastra sem vídeo', async () => {
    const auth = await producerAuth();

    const res = await post(auth, valid).expect(201);

    expect(res.body.videoId).toBeNull();
  });

  it('campo em branco do formulário equivale a sem vídeo', async () => {
    const auth = await producerAuth();

    const res = await post(auth, { ...valid, videoUrl: '' }).expect(201);

    expect(res.body.videoId).toBeNull();
  });

  it('link que não é do YouTube: 400 com a orientação e nada gravado', async () => {
    const auth = await producerAuth();

    const res = await post(auth, {
      ...valid,
      videoUrl: 'https://vimeo.com/123',
    }).expect(400);

    expect(res.body.message).toEqual([VIDEO_URL_ERROR]);
    expect(await products().countDocuments()).toBe(0);
  });

  it('o detalhe público e o catálogo devolvem o vídeo', async () => {
    const auth = await producerAuth();
    const created = await post(auth, {
      ...valid,
      videoUrl: `https://www.youtube.com/watch?v=${ID}`,
    }).expect(201);

    const detail = await t
      .request()
      .get(`${PRODUCTS}/${created.body.id as string}`)
      .expect(200);
    const list = await t.request().get(PRODUCTS).expect(200);

    expect(detail.body.videoId).toBe(ID);
    expect(list.body.itens[0].videoId).toBe(ID);
  });
});
