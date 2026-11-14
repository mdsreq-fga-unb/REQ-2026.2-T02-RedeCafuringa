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

describe('HU20/RF20 — Consultar detalhes do produto (e2e)', () => {
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

  const details = (id: string) => t.request().get(`${PRODUCTS}/${id}`);
  const products = () => t.app.get<Model<Product>>(getModelToken(Product.name));
  const users = () => t.app.get<Model<User>>(getModelToken(User.name));

  it('CA01, CA02, CA04, CA07: sem login, apresenta descrição, preço e fotos', async () => {
    const p = await registerProducer(t);
    const created = await createProduct(t, p.auth, photo, {
      nome: 'Mel silvestre',
      descricao: 'Mel de abelhas nativas da Cafuringa.',
      precoPorUnidade: '35.9',
      gramasPorUnidade: '450',
    });

    const res = await details(created.id).expect(200);

    expect(res.body).toMatchObject({
      id: created.id,
      nome: 'Mel silvestre',
      descricao: 'Mel de abelhas nativas da Cafuringa.',
      precoPorUnidade: 35.9,
      gramasPorUnidade: 450,
      disponivel: true,
    });
    expect(res.body.fotos).toHaveLength(1);
  });

  it('CA03: identifica o produtor e a propriedade responsável', async () => {
    const p = await registerProducer(t, {
      nomeIniciativa: 'Apiário Cafuringa',
      localidade: 'Fazenda Boa Vista',
    });
    const created = await createProduct(t, p.auth, photo);

    const res = await details(created.id).expect(200);

    expect(res.body.produtor).toEqual({
      id: p.id,
      nomeIniciativa: 'Apiário Cafuringa',
      localidade: 'Fazenda Boa Vista',
    });
  });

  it('CA05: não expõe dados pessoais nem privados do produtor', async () => {
    const p = await registerProducer(t);
    await users()
      .updateOne(
        { _id: p.id },
        { $set: { telefone: '61999990000', telefonePublico: true } },
      )
      .exec();
    const created = await createProduct(t, p.auth, photo);

    const res = await details(created.id).expect(200);

    expect(Object.keys(res.body.produtor).sort()).toEqual([
      'id',
      'localidade',
      'nomeIniciativa',
    ]);
    const body = JSON.stringify(res.body);
    for (const privado of [
      p.dto.email,
      p.dto.cpf,
      p.dto.cnpj,
      p.dto.nomeResponsavel,
      '61999990000',
    ])
      expect(body).not.toContain(privado);
  });

  describe('CA06: produto indisponível', () => {
    it('retirado da oferta pública: 404 em vez de oferta ativa', async () => {
      const p = await registerProducer(t);
      const created = await createProduct(t, p.auth, photo);
      await products()
        .updateOne({ _id: created.id }, { $set: { disponivel: false } })
        .exec();

      const res = await details(created.id).expect(404);

      expect(res.body.message).toBe('Produto não encontrado');
    });

    it('de produtor desativado: 404', async () => {
      const p = await registerProducer(t);
      const created = await createProduct(t, p.auth, photo);
      await users()
        .updateOne({ _id: p.id }, { $set: { ativo: false } })
        .exec();

      await details(created.id).expect(404);
    });
  });

  it.each([
    ['inexistente', '64b0c0ffee0000000000beef'],
    ['com identificador inválido', 'nao-e-id'],
  ])('CA08: produto %s informa que não foi encontrado', async (_caso, id) => {
    const res = await details(id).expect(404);
    expect(res.body).toMatchObject({
      statusCode: 404,
      message: 'Produto não encontrado',
    });
  });
});
