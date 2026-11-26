process.env.AUTH_THROTTLE_LIMIT = '1000';

import { VIDEO_URL_ERROR } from '../src/common/video/youtube.js';
import { registerProducer } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const ME = '/api/v1/producers/me/trajectory';
const publicUrl = (id: string) => `/api/v1/producers/${id}/trajectory`;
const ID = 'dQw4w9WgXcQ';
const TRAJETORIA = 'Começamos a plantar café em 1990, no Núcleo Rural.';

describe('Trajetória — vídeo do YouTube (e2e)', () => {
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
  const publicProfile = (id: string) =>
    t.request().get(publicUrl(id)).expect(200);

  it('salva o link e mostra o vídeo na trajetória própria, no perfil e na lista pública', async () => {
    const { id, auth } = await registerProducer(t);

    const saved = await save(auth, {
      trajetoria: TRAJETORIA,
      videoUrl: `https://www.youtube.com/watch?v=${ID}`,
    }).expect(200);

    expect(saved.body.videoId).toBe(ID);
    expect((await own(auth)).body.videoId).toBe(ID);
    expect((await publicProfile(id)).body.videoId).toBe(ID);
    const list = await t.request().get('/api/v1/producers').expect(200);
    expect(
      (list.body as Array<{ id: string; videoId?: string }>).find(
        (p) => p.id === id,
      )?.videoId,
    ).toBe(ID);
  });

  it('salvar sem o campo mantém o vídeo; com null, remove', async () => {
    const { id, auth } = await registerProducer(t);
    await save(auth, {
      trajetoria: TRAJETORIA,
      videoUrl: `https://youtu.be/${ID}`,
    }).expect(200);

    await save(auth, { trajetoria: 'História revista.' }).expect(200);
    expect((await own(auth)).body.videoId).toBe(ID);

    const removed = await save(auth, {
      trajetoria: 'História revista.',
      videoUrl: null,
    }).expect(200);
    expect(removed.body).not.toHaveProperty('videoId');
    expect((await own(auth)).body).not.toHaveProperty('videoId');
    expect((await publicProfile(id)).body).not.toHaveProperty('videoId');
  });

  it('link que não é do YouTube: 400 com a orientação e o vídeo salvo não muda', async () => {
    const { auth } = await registerProducer(t);
    await save(auth, {
      trajetoria: TRAJETORIA,
      videoUrl: `https://youtu.be/${ID}`,
    }).expect(200);

    const res = await save(auth, {
      trajetoria: TRAJETORIA,
      videoUrl: 'https://vimeo.com/123',
    }).expect(400);

    expect(res.body.message).toEqual([VIDEO_URL_ERROR]);
    expect((await own(auth)).body.videoId).toBe(ID);
  });
});
