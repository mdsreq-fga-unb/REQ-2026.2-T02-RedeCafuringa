process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { User } from '../src/modules/users/schemas/user.schema.js';
import { registerProducer, samplePhoto } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const EXPERIENCES = '/api/v1/experiences';

const validExperience = {
  nome: 'Trilha guiada da nascente',
  categoria: 'Experiência',
  descricao: 'Caminhada de 3 km até a nascente, com café da roça.',
  valorPorPessoa: '45',
  local: 'Sítio Boa Vista, Núcleo Rural Cafuringa',
  duracao: '2 horas',
};

type Item = {
  id: string;
  nome: string;
  valorPorPessoa: number;
  fotos: string[];
  produtor: { id: string; nomeIniciativa: string; localidade?: string };
};
const nomes = (itens: Item[]) => itens.map((i) => i.nome);

describe('HU24/RF24 — Consultar catálogo de experiências (e2e)', () => {
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

  const experiences = () =>
    t.app.get<Model<Experience>>(getModelToken(Experience.name));
  const users = () => t.app.get<Model<User>>(getModelToken(User.name));

  async function create(auth: string, nome: string) {
    let req = t.request().post(EXPERIENCES).set('Authorization', auth);
    for (const [field, value] of Object.entries({ ...validExperience, nome }))
      req = req.field(field, value);
    const res = await req.attach('fotos', photo, 'foto.jpg').expect(201);
    return res.body as Item;
  }

  describe('CA01, CA02, CA07: catálogo público com resumo e responsável', () => {
    it('visitante consulta sem login e recebe os dados de identificação', async () => {
      const p = await registerProducer(t, {
        nomeIniciativa: 'Sítio Boa Vista',
        localidade: 'Núcleo Rural Cafuringa',
      });
      await create(p.auth, 'Visita e degustação de queijos');

      const res = await t.request().get(EXPERIENCES).expect(200);

      expect(res.body).toMatchObject({ total: 1, pagina: 1 });
      const [item] = res.body.itens as Item[];
      expect(item).toMatchObject({
        nome: 'Visita e degustação de queijos',
        valorPorPessoa: 45,
        produtor: {
          id: p.id,
          nomeIniciativa: 'Sítio Boa Vista',
          localidade: 'Núcleo Rural Cafuringa',
        },
      });
      expect(item.fotos[0]).toMatch(/^\/experiences\/.+\/photos\//);
    });
  });

  describe('CA03, RN10: só experiências disponíveis de produtores ativos', () => {
    it('esconde a indisponível e a de produtor desativado', async () => {
      const ativo = await registerProducer(t);
      const desativado = await registerProducer(t);
      await create(ativo.auth, 'Disponível');
      const retirada = await create(ativo.auth, 'Retirada da oferta');
      await create(desativado.auth, 'Produtor desativado');
      await experiences()
        .updateOne({ _id: retirada.id }, { $set: { disponivel: false } })
        .exec();
      await users()
        .updateOne({ _id: desativado.id }, { $set: { ativo: false } })
        .exec();

      const res = await t.request().get(EXPERIENCES).expect(200);

      expect(nomes(res.body.itens)).toEqual(['Disponível']);
      expect(res.body.total).toBe(1);
    });
  });

  describe('CA04: catálogo vazio', () => {
    it('200 com lista vazia quando não há experiências disponíveis', async () => {
      const res = await t.request().get(EXPERIENCES).expect(200);

      expect(res.body).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });
  });

  describe('CA06: resultados conforme o que está disponível agora', () => {
    it('pede revalidação a cada acesso e responde 304 enquanto nada muda', async () => {
      const p = await registerProducer(t);
      await create(p.auth, 'Primeira');

      const first = await t.request().get(EXPERIENCES).expect(200);
      expect(first.headers['cache-control']).toBe('no-cache');
      const etag = first.headers.etag as string;
      expect(etag).toBeTruthy();

      await t.request().get(EXPERIENCES).set('If-None-Match', etag).expect(304);

      await create(p.auth, 'Nova');
      const changed = await t
        .request()
        .get(EXPERIENCES)
        .set('If-None-Match', etag)
        .expect(200);
      expect(nomes(changed.body.itens)).toEqual(['Nova', 'Primeira']);
      expect(changed.headers.etag).not.toBe(etag);
    });

    it('uma experiência retirada da oferta some na consulta seguinte', async () => {
      const p = await registerProducer(t);
      const item = await create(p.auth, 'Vai sair');
      expect((await t.request().get(EXPERIENCES).expect(200)).body.total).toBe(
        1,
      );

      await experiences()
        .updateOne({ _id: item.id }, { $set: { disponivel: false } })
        .exec();

      expect((await t.request().get(EXPERIENCES).expect(200)).body.total).toBe(
        0,
      );
    });
  });

  describe('CA08: navegação paginada', () => {
    it('divide o catálogo em páginas sem repetir nem perder itens', async () => {
      const p = await registerProducer(t);
      for (const nome of ['A', 'B', 'C']) await create(p.auth, nome);

      const page1 = await t
        .request()
        .get(EXPERIENCES)
        .query({ limite: 2, pagina: 1 })
        .expect(200);
      const page2 = await t
        .request()
        .get(EXPERIENCES)
        .query({ limite: 2, pagina: 2 })
        .expect(200);

      expect(page1.body).toMatchObject({ total: 3, pagina: 1, limite: 2 });
      expect(nomes(page1.body.itens)).toEqual(['C', 'B']);
      expect(nomes(page2.body.itens)).toEqual(['A']);
    });

    it.each([
      [{ pagina: 0 }, 'Página deve ser maior ou igual a 1'],
      [{ limite: 51 }, 'Limite deve ser no máximo 50'],
    ])('400 em português para %o', async (query, message) => {
      const res = await t.request().get(EXPERIENCES).query(query).expect(400);
      expect(res.body.message).toContain(message);
    });
  });
});
