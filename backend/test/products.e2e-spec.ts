process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getModelToken } from '@nestjs/mongoose';
import { makeProducer } from '@test/factories';
import type { Model, Types } from 'mongoose';
import { PhotoOwnerType } from '../src/common/photos/photo-gallery.policy.js';
import sharp from 'sharp';
import type { Response } from 'supertest';
import { Role } from '../src/modules/users/domain/role.js';
import { Photo } from '../src/common/photos/photo.schema.js';
import { Product } from '../src/modules/products/schemas/product.schema.js';
import { User } from '../src/modules/users/schemas/user.schema.js';
import { loginAs } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const PRODUCTS = '/api/v1/products';
const API = '/api/v1';

/** JPEG como sai de um celular, com o GPS da propriedade no EXIF. */
function phonePhoto(background = '#3a6') {
  return sharp({
    create: { width: 800, height: 600, channels: 3, background },
  })
    .jpeg()
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

function binary(
  response: Response,
  callback: (e: Error | null, b: Buffer) => void,
) {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}

const valid = {
  nome: 'Cesta da estação',
  categoria: 'Produtos',
  descricao: 'Hortaliças frescas cultivadas sem agrotóxicos.',
  precoPorUnidade: '40.5',
  gramasPorUnidade: '500',
};

describe('HU15/RF15 — Cadastrar produto (e2e)', () => {
  let t: TestApp;
  let jpeg: Buffer;

  beforeAll(async () => {
    t = await createTestApp();
    jpeg = await phonePhoto();
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
      nomeIniciativa: dto.nomeIniciativa,
      auth: `Bearer ${login.body.accessToken as string}`,
    };
  }

  function post(
    auth: string | undefined,
    fields: Record<string, string> = valid,
    photos: Buffer[] = [jpeg],
    key?: string,
  ) {
    let req = t.request().post(PRODUCTS);
    if (auth) req = req.set('Authorization', auth);
    if (key) req = req.set('Idempotency-Key', key);
    for (const [name, value] of Object.entries(fields))
      req = req.field(name, value);
    photos.forEach((photo, i) => {
      req = req.attach('fotos', photo, `foto-${i}.jpg`);
    });
    return req;
  }

  const products = () => t.app.get<Model<Product>>(getModelToken(Product.name));
  const photos = () => t.app.get<Model<Photo>>(getModelToken(Photo.name));

  describe('CA03, CA05, CA08 — cadastro concluído e vinculado ao produtor', () => {
    it('201 com os dados, as fotos e o responsável; grava em centavos', async () => {
      const p = await producer();
      const res = await post(p.auth, valid, [
        jpeg,
        await phonePhoto('#a63'),
      ]).expect(201);

      expect(res.body).toMatchObject({
        nome: 'Cesta da estação',
        categoria: 'Produtos',
        descricao: valid.descricao,
        precoPorUnidade: 40.5,
        gramasPorUnidade: 500,
        produtor: { id: p.id, nomeIniciativa: p.nomeIniciativa },
      });
      expect(res.body.fotos).toHaveLength(2);
      expect(res.body.fotos[0]).toMatch(
        new RegExp(`^/products/${res.body.id}/photos/[0-9a-f]{24}\\?v=`),
      );

      const saved = await products().findById(res.body.id).lean().exec();
      expect(saved).toMatchObject({ precoCentavos: 4050, disponivel: true });
      expect(saved?.produtor.toString()).toBe(p.id);
    });

    it('recusa tentativa de escolher outro dono pelo corpo (RN09)', async () => {
      const p = await producer();
      await post(p.auth, {
        ...valid,
        produtor: '64b0c0ffee0000000000abcd',
      }).expect(400);
    });

    it('consulta pública mostra o produto e o responsável (CA08)', async () => {
      const p = await producer();
      const created = await post(p.auth).expect(201);

      const res = await t
        .request()
        .get(`${PRODUCTS}/${created.body.id}`)
        .expect(200);
      expect(res.body).toEqual(created.body);
    });

    it('foto pública é WebP sem EXIF/GPS, com cache por versão e 304', async () => {
      const p = await producer();
      const created = await post(p.auth).expect(201);
      const path = created.body.fotos[0] as string;

      const res = await t
        .request()
        .get(`${API}${path}`)
        .buffer(true)
        .parse(binary)
        .expect(200);
      expect(res.headers['content-type']).toBe('image/webp');
      expect(res.headers['cache-control']).toContain('immutable');
      const meta = await sharp(res.body as Buffer).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();

      await t
        .request()
        .get(`${API}${path}`)
        .set('If-None-Match', res.headers.etag as string)
        .expect(304);
    });

    it('404 para produto inexistente, id inválido ou foto de outro produto', async () => {
      const p = await producer();
      const a = await post(p.auth).expect(201);
      const b = await post(p.auth).expect(201);
      const photoOfB = (b.body.fotos[0] as string).split('/photos/')[1];

      await t.request().get(`${PRODUCTS}/64b0c0ffee0000000000beef`).expect(404);
      await t.request().get(`${PRODUCTS}/nao-e-id`).expect(404);
      await t
        .request()
        .get(`${PRODUCTS}/${a.body.id}/photos/${photoOfB}`)
        .expect(404);
    });

    it('produto some do público quando o produtor é desativado', async () => {
      const p = await producer();
      const created = await post(p.auth).expect(201);
      await t.app
        .get<Model<User>>(getModelToken(User.name))
        .updateOne({ _id: p.id }, { $set: { ativo: false } })
        .exec();

      await t.request().get(`${PRODUCTS}/${created.body.id}`).expect(404);
      await t.request().get(`${API}${created.body.fotos[0]}`).expect(404);
    });
  });

  describe('CA04 — validação', () => {
    it.each([
      ['nome vazio', { nome: '   ' }, /nome do produto/],
      ['categoria fora da lista', { categoria: 'Serviço' }, /Categoria/],
      ['descrição vazia', { descricao: '' }, /descrição/],
      ['preço negativo', { precoPorUnidade: '-1' }, /preço válido/],
      ['preço com 3 casas', { precoPorUnidade: '1.999' }, /preço válido/],
      [
        'preço em notação científica',
        { precoPorUnidade: '1e3' },
        /preço válido/,
      ],
      ['preço vazio', { precoPorUnidade: '' }, /preço válido/],
      ['gramas zero', { gramasPorUnidade: '0' }, /maior que zero/],
      ['nome longo', { nome: 'x'.repeat(121) }, /no máximo 120/],
    ])('400 para %s', async (_case, override, message) => {
      const p = await producer();
      const res = await post(p.auth, { ...valid, ...override }).expect(400);
      expect((res.body.message as string[]).join(' ')).toMatch(message);
      expect(await products().countDocuments()).toBe(0);
    });

    it('preço que não é número gera uma orientação só (RNF03)', async () => {
      const p = await producer();
      const res = await post(p.auth, {
        ...valid,
        precoPorUnidade: 'abc',
      }).expect(400);
      expect(res.body.message).toEqual([
        'Informe um preço válido, com ponto e até 2 casas decimais (ex.: 40.50)',
      ]);
    });

    it('aceita preço zero (oferta gratuita), como o formulário', async () => {
      const p = await producer();
      const res = await post(p.auth, { ...valid, precoPorUnidade: '0' }).expect(
        201,
      );
      expect(res.body.precoPorUnidade).toBe(0);
    });

    it('400 sem foto', async () => {
      const p = await producer();
      const res = await post(p.auth, valid, []).expect(400);
      expect((res.body.message as string[]).join(' ')).toMatch(
        /ao menos uma foto/,
      );
    });

    it('aceita a galeria cheia (10 fotos), na ordem enviada, com a capa primeiro', async () => {
      const p = await producer();
      const colors = Array.from(
        { length: 10 },
        (_, i) => `#${(i + 1).toString(16).repeat(6)}`,
      );
      const files = await Promise.all(colors.map((c) => phonePhoto(c)));
      const res = await post(p.auth, valid, files).expect(201);
      expect(res.body.fotos).toHaveLength(10);

      const stored = await photos()
        .find({ 'dono.tipo': PhotoOwnerType.PRODUTO })
        .sort({ ordem: 1 })
        .select('dono ordem')
        .lean<Array<Pick<Photo, 'dono' | 'ordem'> & { _id: Types.ObjectId }>>()
        .exec();
      expect(stored.map((s) => s.ordem)).toEqual([...Array(10).keys()]);
      expect(stored[0].dono.id.toString()).toBe(res.body.id);
      expect(res.body.fotos[0]).toContain(stored[0]._id.toString());
    });

    it('400 com mais de 10 fotos, em português', async () => {
      const p = await producer();
      const res = await post(
        p.auth,
        valid,
        Array(11).fill(jpeg) as Buffer[],
      ).expect(400);
      expect((res.body.message as string[]).join(' ')).toMatch(
        /no máximo 10 fotos/,
      );
    });

    it('415 para arquivo que não é imagem e não grava nada', async () => {
      const p = await producer();
      const res = await post(p.auth, valid, [
        Buffer.from('<svg onload=alert(1)>'),
      ]).expect(415);
      expect(res.body.message).toMatch(/PNG, JPEG ou WebP/);
      expect(await products().countDocuments()).toBe(0);
      expect(await photos().countDocuments()).toBe(0);
    });

    it('413 para foto acima de 5 MB, em português', async () => {
      const p = await producer();
      const res = await post(p.auth, valid, [
        Buffer.alloc(5 * 1024 * 1024 + 1, 0xff),
      ]).expect(413);
      expect(res.body.message).toMatch(/5 MB/);
    });
  });

  describe('Listagem pública (catálogo, consumida pela HU19)', () => {
    const list = (query = '') => t.request().get(`${PRODUCTS}${query}`);

    it('lista produtos disponíveis, do mais novo ao mais antigo, paginado', async () => {
      const p = await producer();
      const first = await post(p.auth, { ...valid, nome: 'Primeiro' }).expect(
        201,
      );
      const second = await post(p.auth, { ...valid, nome: 'Segundo' }).expect(
        201,
      );

      const res = await list().expect(200);
      expect(res.body).toMatchObject({ total: 2, pagina: 1, limite: 20 });
      expect(res.body.itens.map((i: { id: string }) => i.id)).toEqual([
        second.body.id,
        first.body.id,
      ]);
      // Mesmo formato do detalhe: o front usa um tipo só.
      expect(res.body.itens[1]).toEqual(first.body);
    });

    it('é pública e vazia quando não há produtos', async () => {
      const res = await list().expect(200);
      expect(res.body).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });

    it('esconde indisponíveis e produtos de produtor desativado', async () => {
      const ativo = await producer();
      const inativo = await producer();
      const visivel = await post(ativo.auth).expect(201);
      const indisponivel = await post(ativo.auth).expect(201);
      await post(inativo.auth).expect(201);
      await products()
        .updateOne(
          { _id: indisponivel.body.id },
          { $set: { disponivel: false } },
        )
        .exec();
      await t.app
        .get<Model<User>>(getModelToken(User.name))
        .updateOne({ _id: inativo.id }, { $set: { ativo: false } })
        .exec();

      const res = await list().expect(200);
      expect(res.body.total).toBe(1);
      expect(res.body.itens.map((i: { id: string }) => i.id)).toEqual([
        visivel.body.id,
      ]);
    });

    it('filtra por produtor (catálogo do perfil) e por categoria', async () => {
      const a = await producer();
      const b = await producer();
      const doA = await post(a.auth).expect(201);
      const experiencia = await post(a.auth, {
        ...valid,
        categoria: 'Experiência',
      }).expect(201);
      await post(b.auth).expect(201);

      const deA = await list(`?produtor=${a.id}`).expect(200);
      expect(deA.body.total).toBe(2);
      expect(
        deA.body.itens.every(
          (i: { produtor: { id: string } }) => i.produtor.id === a.id,
        ),
      ).toBe(true);

      const exp = await list(
        `?produtor=${a.id}&categoria=${encodeURIComponent('Experiência')}`,
      ).expect(200);
      expect(exp.body.itens.map((i: { id: string }) => i.id)).toEqual([
        experiencia.body.id,
      ]);
      expect(doA.body.disponivel).toBe(true);
    });

    it('pagina com total correto', async () => {
      const p = await producer();
      for (let i = 0; i < 3; i++) await post(p.auth).expect(201);

      const page2 = await list('?pagina=2&limite=2').expect(200);
      expect(page2.body).toMatchObject({ total: 3, pagina: 2, limite: 2 });
      expect(page2.body.itens).toHaveLength(1);
    });

    it.each([
      ['?limite=51', /no máximo 50/],
      ['?pagina=0', /maior ou igual a 1/],
      ['?produtor=nao-e-id', /Produtor/],
      ['?categoria=Servico', /Categoria/],
      ['?outro=1', /should not exist|não/],
    ])('400 para filtro inválido %s', async (query, message) => {
      const res = await list(query).expect(400);
      expect((res.body.message as string[]).join(' ')).toMatch(message);
    });
  });

  describe('CA06 — restrição de acesso (RN01, RNF08)', () => {
    it('401 para visitante', async () => {
      await post(undefined).expect(401);
    });

    it.each([Role.CONSUMIDOR, Role.ADMINISTRADOR])(
      '403 para %s',
      async (perfil) => {
        const token = await loginAs(t, perfil);
        await post(`Bearer ${token}`).expect(403);
        expect(await products().countDocuments()).toBe(0);
      },
    );
  });

  describe('CA07 — reenvio após falha de conexão', () => {
    it('mesma Idempotency-Key devolve o mesmo produto, sem duplicar', async () => {
      const p = await producer();
      const key = 'hu15-retry-0001';
      const first = await post(p.auth, valid, [jpeg], key).expect(201);
      const again = await post(p.auth, valid, [jpeg], key).expect(201);

      expect(again.body.id).toBe(first.body.id);
      expect(await products().countDocuments()).toBe(1);
      expect(await photos().countDocuments()).toBe(1);
    });

    it('a chave é por produtor: outro produtor cria o próprio produto', async () => {
      const a = await producer();
      const b = await producer();
      const key = 'hu15-shared-key';
      const first = await post(a.auth, valid, [jpeg], key).expect(201);
      const other = await post(b.auth, valid, [jpeg], key).expect(201);
      expect(other.body.id).not.toBe(first.body.id);
      expect(other.body.produtor.id).toBe(b.id);
    });

    it('400 para chave fora do formato', async () => {
      const p = await producer();
      await post(p.auth, valid, [jpeg], 'curta').expect(400);
    });
  });
});
