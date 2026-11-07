// Este arquivo semeia muitos usuários; o limite de autenticação é testado à parte.
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { Types } from 'mongoose';
import { Role } from '../src/modules/users/domain/role.js';
import { loginAs, seedAdmin, seedProducer, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const USERS = '/api/v1/users';

describe('HU04 — Consultar usuários cadastrados (e2e)', () => {
  let t: TestApp;
  let adminToken: string;

  const list = (query: Record<string, string | number> = {}) =>
    t
      .request()
      .get(USERS)
      .query(query)
      .set('Authorization', `Bearer ${adminToken}`);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.clearDatabase();
    adminToken = await loginAs(t, Role.ADMINISTRADOR);
  });

  afterAll(async () => {
    await t?.close();
  });

  describe('GET /users', () => {
    it('CA01/CA09: administrador consulta os usuários de forma paginada (200)', async () => {
      await seedUser(t, Role.CONSUMIDOR, { nome: 'Ana Júlia' });

      const response = await list().expect(200);

      expect(response.body).toEqual({
        itens: expect.any(Array),
        total: 2,
        pagina: 1,
        limite: 20,
      });
    });

    it('CA02/CA03/CA04/CA05: apresenta consumidores, produtores e administradores com o perfil', async () => {
      const consumer = await seedUser(t, Role.CONSUMIDOR);
      const { user: producer, dto } = await seedProducer(t);
      const admin = await seedAdmin(t);

      const { body } = await list().expect(200);

      expect(body.total).toBe(4);
      expect(body.itens).toEqual(
        expect.arrayContaining([
          {
            id: consumer.user.id,
            nome: consumer.user.nome,
            email: consumer.email,
            perfil: 'CONSUMIDOR',
          },
          {
            id: producer.id,
            nome: dto.nomeResponsavel,
            email: dto.email,
            perfil: 'PRODUTOR',
            nomeIniciativa: dto.nomeIniciativa,
          },
          {
            id: admin.user.id,
            nome: 'Administrador',
            email: admin.email,
            perfil: 'ADMINISTRADOR',
          },
        ]),
      );
    });

    it('CA06/RNF11: nenhum item traz senha, hash ou documento', async () => {
      const { cpf, senha } = await seedUser(t, Role.CONSUMIDOR);
      const { dto } = await seedProducer(t);

      const { body } = await list().expect(200);
      const raw = JSON.stringify(body);

      for (const secret of [senha, cpf, dto.cpf, dto.cnpj as string]) {
        expect(raw).not.toContain(secret);
      }
      expect(raw).not.toMatch(/senha|hash|cifrado|argon2/i);
    });

    it('CA09: ordena alfabeticamente pelo nome, ignorando acentos', async () => {
      await seedUser(t, Role.CONSUMIDOR, { nome: 'Bruno' });
      await seedUser(t, Role.CONSUMIDOR, { nome: 'Álvaro' });
      await seedUser(t, Role.CONSUMIDOR, { nome: 'Carla' });

      const { body } = await list({ perfil: 'CONSUMIDOR' }).expect(200);

      expect(body.itens.map((u: { nome: string }) => u.nome)).toEqual([
        'Álvaro',
        'Bruno',
        'Carla',
      ]);
    });

    it.each([
      ['CONSUMIDOR', 'CA02'],
      ['PRODUTOR', 'CA03'],
      ['ADMINISTRADOR', 'CA04'],
    ])('%s (%s): filtra pelo perfil', async (perfil) => {
      await seedUser(t, Role.CONSUMIDOR);
      await seedProducer(t);
      await seedAdmin(t);

      const { body } = await list({ perfil }).expect(200);

      expect(body.itens.length).toBeGreaterThan(0);
      expect(body.total).toBe(body.itens.length);
      for (const item of body.itens) expect(item.perfil).toBe(perfil);
    });

    it('busca por nome, e-mail ou iniciativa sem diferenciar maiúsculas', async () => {
      await seedUser(t, Role.CONSUMIDOR, { nome: 'Francisco Pereira' });
      await seedUser(t, Role.CONSUMIDOR, { email: 'zeca@exemplo.com' });
      await seedProducer(t, { nomeIniciativa: 'Sítio Boa Vista' });

      const byName = await list({ busca: 'francisco' }).expect(200);
      const byEmail = await list({ busca: 'ZECA@' }).expect(200);
      const byInitiative = await list({ busca: 'boa vista' }).expect(200);

      expect(byName.body.itens).toHaveLength(1);
      expect(byEmail.body.itens).toHaveLength(1);
      expect(byInitiative.body.itens).toEqual([
        expect.objectContaining({ nomeIniciativa: 'Sítio Boa Vista' }),
      ]);
    });

    it('RNF03: trata caracteres especiais da busca como texto', async () => {
      await seedUser(t, Role.CONSUMIDOR, { nome: 'Maria' });

      const { body } = await list({ busca: '.*' }).expect(200);

      expect(body.itens).toEqual([]);
    });

    it('pagina os resultados', async () => {
      for (const nome of ['Ana', 'Bia', 'Caio']) {
        await seedUser(t, Role.CONSUMIDOR, { nome });
      }

      const { body } = await list({
        perfil: 'CONSUMIDOR',
        pagina: 2,
        limite: 2,
      }).expect(200);

      expect(body).toMatchObject({ total: 3, pagina: 2, limite: 2 });
      expect(body.itens.map((u: { nome: string }) => u.nome)).toEqual(['Caio']);
    });

    it('CA08: sem registros, devolve lista vazia e total zero', async () => {
      const { body } = await list({ perfil: 'PRODUTOR' }).expect(200);

      expect(body).toMatchObject({ itens: [], total: 0 });
    });

    it.each([
      [{ perfil: 'VISITANTE' }, 'Perfil inválido'],
      [{ limite: 51 }, 'Limite deve ser no máximo 50'],
      [{ limite: 0 }, 'Limite deve ser maior ou igual a 1'],
      [{ pagina: 0 }, 'Página deve ser maior ou igual a 1'],
      [{ pagina: 'abc' }, 'Página deve ser um número inteiro'],
      [{ busca: 'a'.repeat(101) }, 'Busca deve ter no máximo 100 caracteres'],
    ])('RNF03: 400 para filtro inválido %o', async (query, message) => {
      const { body } = await list(query).expect(400);

      expect(body.message).toContain(message);
    });

    it('CA07/RNF08: 401 sem login', async () => {
      await t.request().get(USERS).expect(401);
    });

    it.each([Role.CONSUMIDOR, Role.PRODUTOR])(
      'CA07/RNF08: 403 para %s',
      async (perfil) => {
        const token = await loginAs(t, perfil);

        await t
          .request()
          .get(USERS)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      },
    );
  });

  describe('GET /users/:id', () => {
    const detail = (id: string, token = adminToken) =>
      t.request().get(`${USERS}/${id}`).set('Authorization', `Bearer ${token}`);

    it('CA05/CA06: detalha o produtor com documentos mascarados e sem senha', async () => {
      const { user, dto } = await seedProducer(t, {
        telefone: '61999990000',
      });

      const { body } = await detail(user.id).expect(200);

      expect(body).toEqual({
        id: user.id,
        nome: dto.nomeResponsavel,
        email: dto.email,
        perfil: 'PRODUTOR',
        telefone: '61999990000',
        cpf: expect.stringMatching(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/),
        cnpj: expect.stringMatching(/^\*\*\.\w{3}\.\w{3}\/\w{4}-\*\*$/),
        nomeIniciativa: dto.nomeIniciativa,
        nomeResponsavel: dto.nomeResponsavel,
        localidade: dto.localidade,
        categoriaOfertada: dto.categoriaOfertada,
        formasPagamento: dto.formasPagamento,
      });
      const raw = JSON.stringify(body);
      expect(raw).not.toContain(dto.cpf);
      expect(raw).not.toContain(dto.cnpj);
    });

    it('CA02: detalha o consumidor', async () => {
      const { user, email } = await seedUser(t, Role.CONSUMIDOR);

      const { body } = await detail(user.id).expect(200);

      expect(body).toEqual({
        id: user.id,
        nome: user.nome,
        email,
        perfil: 'CONSUMIDOR',
        telefone: user.telefone,
        cpf: expect.stringMatching(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/),
      });
    });

    it('CA04: detalha outro administrador', async () => {
      const { user, email } = await seedAdmin(t);

      const { body } = await detail(user.id).expect(200);

      expect(body).toEqual({
        id: user.id,
        nome: 'Administrador',
        email,
        perfil: 'ADMINISTRADOR',
      });
    });

    it('404 para usuário inexistente ou id malformado', async () => {
      await detail(new Types.ObjectId().toHexString()).expect(404);
      await detail('nao-e-um-id').expect(404);
    });

    it('CA07/RNF08: 401 sem login', async () => {
      const { user } = await seedUser(t, Role.CONSUMIDOR);

      await t.request().get(`${USERS}/${user.id}`).expect(401);
    });

    it.each([Role.CONSUMIDOR, Role.PRODUTOR])(
      'CA07/RNF08: 403 para %s, inclusive consultando a própria conta',
      async (perfil) => {
        const { email, senha, user } = await seedUser(t, perfil);
        const {
          body: { accessToken },
        } = await t
          .request()
          .post('/api/v1/auth/login')
          .send({ email, senha })
          .expect(200);

        await detail(user.id, accessToken as string).expect(403);
      },
    );
  });
});
