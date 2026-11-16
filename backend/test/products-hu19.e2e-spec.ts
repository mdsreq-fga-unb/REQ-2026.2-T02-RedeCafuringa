process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Product } from '../src/modules/products/schemas/product.schema.js';
import { User } from '../src/modules/users/schemas/user.schema.js';
import {
  createProduct,
  registerProducer,
  samplePhoto,
} from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const PRODUCTS = '/api/v1/products';

type Item = { id: string; nome: string; produtor: { nomeIniciativa: string } };
const ids = (itens: Item[]) => itens.map((i) => i.id);

describe('HU19/RF19 — Consultar catálogo de produtos (e2e)', () => {
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

  const list = (query = '') => t.request().get(`${PRODUCTS}${query}`);
  const products = () => t.app.get<Model<Product>>(getModelToken(Product.name));
  const users = () => t.app.get<Model<User>>(getModelToken(User.name));

  it('CA02, CA03, CA07: sem login, apresenta os produtos com dados resumidos', async () => {
    const p = await registerProducer(t, { nomeIniciativa: 'Horta da Joana' });
    const created = await createProduct(t, p.auth, photo, { nome: 'Mel' });

    const res = await list().expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.itens[0]).toMatchObject({
      id: created.id,
      nome: 'Mel',
      precoPorUnidade: 40.5,
      gramasPorUnidade: 500,
      produtor: { id: p.id, nomeIniciativa: 'Horta da Joana' },
    });
    expect(res.body.itens[0].fotos).toHaveLength(1);
  });

  it('CA04: não apresenta indisponíveis nem produtos de produtor desativado', async () => {
    const ativo = await registerProducer(t);
    const inativo = await registerProducer(t);
    const visivel = await createProduct(t, ativo.auth, photo);
    const retirado = await createProduct(t, ativo.auth, photo);
    await createProduct(t, inativo.auth, photo);
    await products()
      .updateOne({ _id: retirado.id }, { $set: { disponivel: false } })
      .exec();
    await users()
      .updateOne({ _id: inativo.id }, { $set: { ativo: false } })
      .exec();

    const res = await list().expect(200);

    expect(res.body.total).toBe(1);
    expect(ids(res.body.itens)).toEqual([visivel.id]);
  });

  it('CA06: sem produtos disponíveis, devolve a página vazia', async () => {
    const res = await list().expect(200);
    expect(res.body).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
  });

  describe('RN15 — busca por texto', () => {
    it('encontra pelo nome do produto, sem diferenciar acentos e maiúsculas', async () => {
      const p = await registerProducer(t);
      const cafe = await createProduct(t, p.auth, photo, {
        nome: 'Café torrado',
      });
      await createProduct(t, p.auth, photo, { nome: 'Queijo minas' });

      const res = await list('?busca=CAFE').expect(200);

      expect(res.body.total).toBe(1);
      expect(ids(res.body.itens)).toEqual([cafe.id]);
    });

    it('encontra pelo nome da iniciativa do produtor', async () => {
      const joana = await registerProducer(t, {
        nomeIniciativa: 'Horta da Joana',
      });
      const outro = await registerProducer(t, {
        nomeIniciativa: 'Sítio Boa Vista',
      });
      const daJoana = await createProduct(t, joana.auth, photo);
      await createProduct(t, outro.auth, photo);

      const res = await list('?busca=joana').expect(200);

      expect(ids(res.body.itens)).toEqual([daJoana.id]);
    });

    it('combina com categoria e pagina com o total da busca', async () => {
      const p = await registerProducer(t);
      for (let i = 0; i < 3; i++)
        await createProduct(t, p.auth, photo, { nome: `Mel ${i}` });
      await createProduct(t, p.auth, photo, {
        nome: 'Mel na trilha',
        categoria: 'Experiência',
      });
      await createProduct(t, p.auth, photo, { nome: 'Queijo' });

      const res = await list(
        '?busca=mel&categoria=Produtos&pagina=2&limite=2',
      ).expect(200);

      expect(res.body).toMatchObject({ total: 3, pagina: 2, limite: 2 });
      expect(res.body.itens).toHaveLength(1);
    });

    it('trata o termo como texto literal e informa quando nada é encontrado', async () => {
      const p = await registerProducer(t);
      await createProduct(t, p.auth, photo);

      const res = await list(`?busca=${encodeURIComponent('.*')}`).expect(200);

      expect(res.body).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });

    it('400 para busca com mais de 100 caracteres', async () => {
      const res = await list(`?busca=${'a'.repeat(101)}`).expect(400);
      expect((res.body.message as string[]).join(' ')).toMatch(/no máximo 100/);
    });
  });
});
