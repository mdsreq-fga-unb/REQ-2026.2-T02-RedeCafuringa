process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeProducer } from '@test/factories';
import { Types } from 'mongoose';
import sharp from 'sharp';
import type { Response } from 'supertest';
import { Role } from '../src/modules/users/domain/role.js';
import { loginAs } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const ME_PHOTO = '/api/v1/producers/me/photo';
const ME_TRAJECTORY = '/api/v1/producers/me/trajectory';
const API = '/api/v1';

/** JPEG como sai de um celular: girado pelo EXIF e com o GPS da propriedade. */
function phonePhoto(background = '#3a6') {
  return sharp({
    create: { width: 1600, height: 1200, channels: 3, background },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD3: {
        GPSLatitudeRef: 'S',
        GPSLatitude: '15/1 47/1 0/1',
        GPSLongitudeRef: 'W',
        GPSLongitude: '47/1 52/1 0/1',
      },
    })
    .toBuffer();
}

/** Corpo binário da resposta (o supertest não lê image/webp sozinho). */
function binary(
  response: Response,
  callback: (e: Error | null, b: Buffer) => void,
) {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}

describe('HU12/RF12 — Foto de perfil do produtor (e2e)', () => {
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

  async function producer() {
    const dto = makeProducer();
    const created = await t
      .request()
      .post('/api/v1/users/producers')
      .send(dto)
      .expect(201);
    const login = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email: dto.email, senha: dto.senha })
      .expect(200);
    return {
      id: created.body.id as string,
      auth: `Bearer ${login.body.accessToken as string}`,
    };
  }

  const upload = (auth: string, file: Buffer, name = 'foto.jpg') =>
    t
      .request()
      .put(ME_PHOTO)
      .set('Authorization', auth)
      .attach('foto', file, { filename: name, contentType: 'image/jpeg' });

  const publish = (auth: string) =>
    t
      .request()
      .put(ME_TRAJECTORY)
      .set('Authorization', auth)
      .send({ trajetoria: 'Plantamos café desde 1990.' })
      .expect(200);

  const fetchPhoto = (url: string) =>
    t.request().get(`${API}${url}`).buffer(true).parse(binary);

  describe('envio', () => {
    it('grava a foto e a devolve na própria trajetória', async () => {
      const { id, auth } = await producer();

      const response = await upload(auth, await phonePhoto()).expect(200);

      expect(response.body.fotoUrl).toMatch(
        new RegExp(`^/producers/${id}/photo\\?v=[\\w-]{16}$`),
      );
      const own = await t
        .request()
        .get(ME_TRAJECTORY)
        .set('Authorization', auth)
        .expect(200);
      expect(own.body.fotoUrl).toBe(response.body.fotoUrl);
    });

    it('trocar a foto muda a versão; reenviar a mesma não muda', async () => {
      const { auth } = await producer();
      const first = await upload(auth, await phonePhoto()).expect(200);
      const again = await upload(auth, await phonePhoto()).expect(200);
      const other = await upload(auth, await phonePhoto('#a33')).expect(200);

      expect(again.body.fotoUrl).toBe(first.body.fotoUrl);
      expect(other.body.fotoUrl).not.toBe(first.body.fotoUrl);
    });

    it('415 para arquivo que não é imagem, mesmo com nome e tipo de JPEG', async () => {
      const { auth } = await producer();

      const response = await upload(
        auth,
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
        ),
      ).expect(415);

      expect(response.body.message).toMatch(/PNG, JPEG ou WebP/);
    });

    it('413 para arquivo acima de 5 MB', async () => {
      const { auth } = await producer();

      await upload(auth, Buffer.alloc(5 * 1024 * 1024 + 1, 0xff)).expect(413);
    });

    it('400 sem arquivo ou com o arquivo em outro campo', async () => {
      const { auth } = await producer();

      await t.request().put(ME_PHOTO).set('Authorization', auth).expect(400);
      await t
        .request()
        .put(ME_PHOTO)
        .set('Authorization', auth)
        .attach('arquivo', await phonePhoto(), 'foto.jpg')
        .expect(400);
    });

    it('401 sem token e 403 para quem não é produtor (RNF08)', async () => {
      const file = await phonePhoto();
      await t
        .request()
        .put(ME_PHOTO)
        .attach('foto', file, 'foto.jpg')
        .expect(401);

      const consumidor = await loginAs(t, Role.CONSUMIDOR);
      await upload(`Bearer ${consumidor}`, file).expect(403);
      await t
        .request()
        .delete(ME_PHOTO)
        .set('Authorization', `Bearer ${consumidor}`)
        .expect(403);
    });
  });

  describe('exibição pública (CA05, RN07)', () => {
    it('fica oculta até a trajetória ser publicada', async () => {
      const { id, auth } = await producer();
      const { body } = await upload(auth, await phonePhoto()).expect(200);

      await fetchPhoto(body.fotoUrl).expect(404);

      await publish(auth);
      await fetchPhoto(body.fotoUrl).expect(200);
      const profile = await t
        .request()
        .get(`${API}/producers/${id}/trajectory`)
        .expect(200);
      expect(profile.body.fotoUrl).toBe(body.fotoUrl);
    });

    it('serve WebP sem EXIF/GPS, já girado, com cache permanente e liberado para o front em outra origem', async () => {
      const { auth } = await producer();
      await publish(auth);
      const { body } = await upload(auth, await phonePhoto()).expect(200);

      const response = await fetchPhoto(body.fotoUrl).expect(200);

      expect(response.headers['content-type']).toBe('image/webp');
      expect(response.headers['cache-control']).toBe(
        'public, max-age=31536000, immutable',
      );
      expect(response.headers['cross-origin-resource-policy']).toBe(
        'cross-origin',
      );
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers.etag).toMatch(/^"[\w-]{16}"$/);

      const meta = await sharp(response.body as Buffer).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
      // A foto 1600x1200 com orientação 6 fica em pé e no máximo com 960 px.
      expect([meta.width, meta.height]).toEqual([720, 960]);
    });

    it('URL de versão antiga não fica em cache permanente', async () => {
      const { id, auth } = await producer();
      await publish(auth);
      await upload(auth, await phonePhoto()).expect(200);

      const response = await fetchPhoto(
        `/producers/${id}/photo?v=velha`,
      ).expect(200);

      expect(response.headers['cache-control']).toBe('no-cache');
    });

    it('responde 304 quando o navegador já tem a versão atual', async () => {
      const { auth } = await producer();
      await publish(auth);
      const { body } = await upload(auth, await phonePhoto()).expect(200);
      const first = await fetchPhoto(body.fotoUrl).expect(200);

      await t
        .request()
        .get(`${API}${body.fotoUrl}`)
        .set('If-None-Match', first.headers.etag)
        .expect(304);
    });

    it('404 para produtor sem foto, inexistente ou id inválido', async () => {
      const { id, auth } = await producer();
      await publish(auth);

      await fetchPhoto(`/producers/${id}/photo`).expect(404);
      await fetchPhoto(
        `/producers/${new Types.ObjectId().toHexString()}/photo`,
      ).expect(404);
      await fetchPhoto('/producers/nao-e-id/photo').expect(404);
    });
  });

  describe('remoção', () => {
    it('remove a foto do perfil e do banco; repetir é seguro', async () => {
      const { id, auth } = await producer();
      await publish(auth);
      const { body } = await upload(auth, await phonePhoto()).expect(200);

      await t.request().delete(ME_PHOTO).set('Authorization', auth).expect(204);
      await t.request().delete(ME_PHOTO).set('Authorization', auth).expect(204);

      await fetchPhoto(body.fotoUrl).expect(404);
      const own = await t
        .request()
        .get(ME_TRAJECTORY)
        .set('Authorization', auth)
        .expect(200);
      expect(own.body.fotoUrl).toBeUndefined();
      expect(
        await t.connection
          .collection('producer_photos')
          .countDocuments({ _id: new Types.ObjectId(id) }),
      ).toBe(0);
    });
  });
});
