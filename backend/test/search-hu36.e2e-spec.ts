process.env.AUTH_THROTTLE_LIMIT = '1000';

import {
  createProduct,
  registerProducer,
  samplePhoto,
} from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const SEARCH = '/api/v1/search';

type Grupo = { itens: Array<{ id: string }>; total: number };
const ids = (grupo: Grupo) => grupo.itens.map((i) => i.id);

describe('HU36/RF36 — Buscar ofertas (e2e)', () => {
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

  const search = (query: string) => t.request().get(`${SEARCH}${query}`);
  const term = (busca: string) => `?busca=${encodeURIComponent(busca)}`;

  async function publishTrajectory(auth: string, trajetoria: string) {
    await t
      .request()
      .put('/api/v1/producers/me/trajectory')
      .set('Authorization', auth)
      .send({ trajetoria, atividades: 'Visitas guiadas.' })
      .expect(200);
  }

  async function createExperience(auth: string, nome: string) {
    const res = await t
      .request()
      .post('/api/v1/experiences')
      .set('Authorization', auth)
      .field('nome', nome)
      .field('categoria', 'Experiência')
      .field('descricao', 'Caminhada de 3 km até a nascente.')
      .field('valorPorPessoa', '45.5')
      .field('local', 'Sítio Boa Vista')
      .field('duracao', '2 horas')
      .attach('fotos', photo, 'foto.jpg')
      .expect(201);
    return res.body as { id: string };
  }

  describe('CA03, CA04, CA09: visitante busca produtores, produtos e experiências', () => {
    it('sem login, agrupa o que combina com o termo, sem diferenciar acentos', async () => {
      const joana = await registerProducer(t, {
        nomeIniciativa: 'Horta da Joana',
      });
      await publishTrajectory(joana.auth, 'Plantamos café há 20 anos.');
      const cafe = await createProduct(t, joana.auth, photo, {
        nome: 'Café torrado',
      });
      await createProduct(t, joana.auth, photo, { nome: 'Queijo minas' });
      const trilha = await createExperience(joana.auth, 'Trilha do café');
      await createExperience(joana.auth, 'Passeio a cavalo');

      const res = await search(term('CAFE')).expect(200);

      expect(res.body.termo).toBe('CAFE');
      expect(ids(res.body.produtos)).toEqual([cafe.id]);
      expect(ids(res.body.experiencias)).toEqual([trilha.id]);
      expect(ids(res.body.produtores)).toEqual([joana.id]);
      expect(res.body.produtos.total).toBe(1);
      expect(res.body.experiencias.total).toBe(1);
      expect(res.body.produtores.total).toBe(1);
    });

    it('encontra as ofertas pelo nome da iniciativa do produtor', async () => {
      const joana = await registerProducer(t, {
        nomeIniciativa: 'Horta da Joana',
      });
      const outro = await registerProducer(t, {
        nomeIniciativa: 'Sítio Boa Vista',
      });
      const daJoana = await createProduct(t, joana.auth, photo, {
        nome: 'Mel',
      });
      await createProduct(t, outro.auth, photo, { nome: 'Mel' });

      const res = await search(term('joana')).expect(200);

      expect(ids(res.body.produtos)).toEqual([daJoana.id]);
    });

    it('só traz produtores com a trajetória publicada', async () => {
      const publicado = await registerProducer(t, {
        nomeIniciativa: 'Horta Aberta',
      });
      await publishTrajectory(publicado.auth, 'Nossa história.');
      await registerProducer(t, { nomeIniciativa: 'Horta Fechada' });

      const res = await search(term('horta')).expect(200);

      expect(ids(res.body.produtores)).toEqual([publicado.id]);
    });

    it('limita cada grupo ao limite pedido, mantendo o total', async () => {
      const p = await registerProducer(t);
      for (let i = 0; i < 3; i++)
        await createProduct(t, p.auth, photo, { nome: `Mel ${i}` });

      const res = await search(`${term('mel')}&limite=2`).expect(200);

      expect(res.body.produtos.itens).toHaveLength(2);
      expect(res.body.produtos.total).toBe(3);
    });

    it('não expõe e-mail, CPF, CNPJ nem senha de ninguém', async () => {
      const p = await registerProducer(t, { nomeIniciativa: 'Horta Segura' });
      await publishTrajectory(p.auth, 'Nossa história.');
      await createProduct(t, p.auth, photo, { nome: 'Horta em vaso' });

      const res = await search(term('horta')).expect(200);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(p.dto.email);
      expect(body).not.toContain(p.dto.cpf);
      expect(body).not.toContain(p.dto.cnpj);
      expect(body).not.toContain(p.dto.senha);
    });
  });

  describe('CA06: busca sem resultados', () => {
    it('200 com os três grupos vazios', async () => {
      const p = await registerProducer(t);
      await createProduct(t, p.auth, photo);

      const res = await search(term('xyzzy')).expect(200);

      expect(res.body).toEqual({
        termo: 'xyzzy',
        produtores: { itens: [], total: 0 },
        produtos: { itens: [], total: 0 },
        experiencias: { itens: [], total: 0 },
      });
    });

    it('trata o termo como texto literal', async () => {
      const p = await registerProducer(t);
      await createProduct(t, p.auth, photo, { nome: 'Cesta da estação' });

      // Como regex, "c.*a" casaria com "Cesta"; como texto literal, não.
      const res = await search(term('c.*a')).expect(200);

      expect(res.body.produtos.total).toBe(0);
    });
  });

  describe('CA08: termo inválido', () => {
    it.each([
      ['ausente', '', /Informe o que você quer buscar/],
      ['vazio', '?busca=', /Informe o que você quer buscar/],
      ['só espaços', '?busca=%20%20', /Informe o que você quer buscar/],
      ['curto demais', '?busca=a', /pelo menos 2 caracteres/],
      ['só símbolos', '?busca=%25%25%25', /letras, números e pontuação/],
      ['longo demais', `?busca=${'a'.repeat(101)}`, /no máximo 100 caracteres/],
    ])('%s: 400 explicando como corrigir', async (_caso, query, message) => {
      const res = await search(query).expect(400);

      expect((res.body.message as string[]).join(' ')).toMatch(message);
    });

    it('400 para limite fora do intervalo', async () => {
      await search(`${term('cafe')}&limite=0`).expect(400);
      await search(`${term('cafe')}&limite=51`).expect(400);
    });
  });
});
