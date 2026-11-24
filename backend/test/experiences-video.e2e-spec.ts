process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { VIDEO_URL_ERROR } from '../src/common/video/youtube.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { registerProducer, samplePhoto } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const EXPERIENCES = '/api/v1/experiences';
const ID = 'dQw4w9WgXcQ';

const valid = {
  nome: 'Trilha guiada da nascente',
  categoria: 'Experiência',
  descricao: 'Caminhada de 3 km até a nascente, com café da roça.',
  valorPorPessoa: '45',
  local: 'Sítio Boa Vista',
  duracao: '2 horas',
};

describe('Experiência — vídeo do YouTube (e2e)', () => {
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

  function post(auth: string, fields: Record<string, string>) {
    let req = t.request().post(EXPERIENCES).set('Authorization', auth);
    for (const [name, value] of Object.entries(fields))
      req = req.field(name, value);
    return req.attach('fotos', photo, 'foto.jpg');
  }

  const experiences = () =>
    t.app.get<Model<Experience>>(getModelToken(Experience.name));

  it('cadastra com o link e guarda só o id do vídeo', async () => {
    const { auth } = await registerProducer(t);

    const res = await post(auth, {
      ...valid,
      videoUrl: `https://www.youtube.com/shorts/${ID}`,
    }).expect(201);

    expect(res.body.videoId).toBe(ID);
    const saved = await experiences().findById(res.body.id).lean();
    expect(saved).toMatchObject({ videoId: ID });
    expect(saved).not.toHaveProperty('videoUrl');
  });

  it('sem link, cadastra sem vídeo', async () => {
    const { auth } = await registerProducer(t);

    const res = await post(auth, valid).expect(201);

    expect(res.body.videoId).toBeNull();
  });

  it('link que não é do YouTube: 400 com a orientação e nada gravado', async () => {
    const { auth } = await registerProducer(t);

    const res = await post(auth, {
      ...valid,
      videoUrl: 'https://vimeo.com/123',
    }).expect(400);

    expect(res.body.message).toEqual([VIDEO_URL_ERROR]);
    expect(await experiences().countDocuments()).toBe(0);
  });

  it('o detalhe público e o catálogo devolvem o vídeo', async () => {
    const { auth } = await registerProducer(t);
    const created = await post(auth, {
      ...valid,
      videoUrl: `https://youtu.be/${ID}`,
    }).expect(201);

    const detail = await t
      .request()
      .get(`${EXPERIENCES}/${created.body.id as string}`)
      .expect(200);
    const list = await t.request().get(EXPERIENCES).expect(200);

    expect(detail.body.videoId).toBe(ID);
    expect(list.body.itens[0].videoId).toBe(ID);
  });
});
