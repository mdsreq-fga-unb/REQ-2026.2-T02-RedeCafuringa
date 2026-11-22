process.env.AUTH_THROTTLE_LIMIT = '1000';

import { futureBookingDate } from '@test/factories';
import { getModelToken } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  BookingStatus,
  PaymentMethod,
} from '../src/modules/bookings/domain/booking.js';
import { Booking } from '../src/modules/bookings/schemas/booking.schema.js';
import { ExperienceCategory } from '../src/modules/experiences/domain/experience.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { seedAdmin, seedProducer, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('HU45/RF45 — Consultar pré-reserva (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await bookings().init();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  const bookings = () => t.app.get<Model<Booking>>(getModelToken(Booking.name));
  const experiences = () =>
    t.app.get<Model<Experience>>(getModelToken(Experience.name));

  async function login(email: string, senha: string): Promise<string> {
    const res = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email, senha })
      .expect(200);
    return res.body.accessToken as string;
  }

  async function consumer(nome = 'Maria das Graças') {
    const { user, email, senha } = await seedUser(t, Role.CONSUMIDOR, { nome });
    return { id: user._id as Types.ObjectId, token: await login(email, senha) };
  }

  async function producer() {
    const { user, dto } = await seedProducer(t);
    return {
      id: user._id as Types.ObjectId,
      token: await login(dto.email, dto.senha),
    };
  }

  async function admin() {
    const { email, senha } = await seedAdmin(t);
    return login(email, senha);
  }

  async function experienceOf(
    produtor: Types.ObjectId,
    overrides: Partial<Record<string, unknown>> = {},
  ) {
    return experiences().create({
      produtor,
      nome: 'Trilha guiada da nascente',
      categoria: ExperienceCategory.EXPERIENCIA,
      descricao: 'Caminhada de 3 km até a nascente.',
      valorCentavos: 4550,
      local: 'Sítio Boa Vista',
      duracao: '2 horas',
      fotos: [{ id: new Types.ObjectId(), versao: 'v1' }],
      ...overrides,
    });
  }

  async function seedBooking(
    from: {
      consumidor: Types.ObjectId;
      produtor: Types.ObjectId;
      experiencia: Types.ObjectId;
    },
    overrides: Partial<Record<string, unknown>> = {},
  ) {
    return bookings().create({
      data: futureBookingDate(),
      horario: '09:00',
      participantes: 4,
      formaPagamento: PaymentMethod.PIX,
      mensagem: 'Vamos com duas crianças.',
      status: BookingStatus.PENDENTE,
      ...from,
      ...overrides,
    });
  }

  /** Consumidor, produtor, experiência e uma solicitação ligando os três. */
  async function scenario() {
    const c = await consumer();
    const p = await producer();
    const exp = await experienceOf(p.id);
    const booking = await seedBooking({
      consumidor: c.id,
      produtor: p.id,
      experiencia: exp._id,
    });
    return { c, p, exp, booking };
  }

  const get = (path: string, token?: string) => {
    const req = t.request().get(`${BOOKINGS}${path}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  describe('CA01, RNF08: só consumidor e produtor autenticados consultam', () => {
    it.each(['/mine', '/received', `/${new Types.ObjectId().toHexString()}`])(
      '401 sem token em GET %s',
      async (path) => {
        await get(path).expect(401);
      },
    );

    it('401 com token inválido', async () => {
      await get('/mine', 'token-invalido').expect(401);
    });

    it.each(['/mine', '/received', `/${new Types.ObjectId().toHexString()}`])(
      '403 para o administrador em GET %s',
      async (path) => {
        await get(path, await admin()).expect(403);
      },
    );

    it('403: produtor não usa a lista do consumidor e vice-versa', async () => {
      const c = await consumer();
      const p = await producer();

      await get('/mine', p.token).expect(403);
      await get('/received', c.token).expect(403);
    });
  });

  describe('CA02: consumidor consulta as solicitações da própria conta', () => {
    it('200 com as suas solicitações, da mais nova à mais antiga, e nenhuma de outro consumidor', async () => {
      const c = await consumer();
      const other = await consumer('Outra Pessoa');
      const p = await producer();
      const exp = await experienceOf(p.id);
      const link = { produtor: p.id, experiencia: exp._id };
      const first = await seedBooking({ consumidor: c.id, ...link });
      const second = await seedBooking({ consumidor: c.id, ...link });
      await seedBooking({ consumidor: other.id, ...link });

      const res = await get('/mine', c.token).expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.itens.map((i: { id: string }) => i.id)).toEqual([
        second._id.toHexString(),
        first._id.toHexString(),
      ]);
    });

    it('traz a experiência e o produtor, sem dados pessoais (RNF11)', async () => {
      const { c, p, exp, booking } = await scenario();

      const res = await get('/mine', c.token).expect(200);

      expect(res.body).toEqual({
        itens: [
          {
            id: booking._id.toHexString(),
            experienciaId: exp._id.toHexString(),
            data: booking.data,
            horario: '09:00',
            participantes: 4,
            formaPagamento: 'pix',
            mensagem: 'Vamos com duas crianças.',
            status: 'pendente',
            criadoEm: expect.any(String),
            atualizadoEm: expect.any(String),
            experiencia: {
              nome: 'Trilha guiada da nascente',
              local: 'Sítio Boa Vista',
              valorPorPessoa: 45.5,
              disponivel: true,
              foto: expect.stringMatching(
                new RegExp(
                  `^/experiences/${exp._id.toHexString()}/photos/[a-f0-9]{24}\\?v=v1$`,
                ),
              ),
            },
            contraparte: {
              id: p.id.toHexString(),
              nome: 'Horta Comunitária Cafuringa',
            },
          },
        ],
        total: 1,
        pagina: 1,
        limite: 20,
      });
      expect(JSON.stringify(res.body)).not.toMatch(
        /@exemplo\.com|cpf|cnpj|telefone|senha|hash/i,
      );
    });

    it('pagina os resultados', async () => {
      const c = await consumer();
      const p = await producer();
      const exp = await experienceOf(p.id);
      const link = { consumidor: c.id, produtor: p.id, experiencia: exp._id };
      const made = [];
      for (let i = 0; i < 3; i++) made.push(await seedBooking(link));
      const newestFirst = made.map((b) => b._id.toHexString()).reverse();

      const page2 = await get('/mine?pagina=2&limite=2', c.token).expect(200);

      expect(page2.body).toMatchObject({ total: 3, pagina: 2, limite: 2 });
      expect(page2.body.itens.map((i: { id: string }) => i.id)).toEqual([
        newestFirst[2],
      ]);
    });
  });

  describe('CA03: produtor consulta as solicitações das suas experiências', () => {
    it('200 só com as recebidas por ele, com o consumidor como contraparte', async () => {
      const c = await consumer('Maria das Graças');
      const mine = await producer();
      const stranger = await producer();
      const expMine = await experienceOf(mine.id);
      const expStranger = await experienceOf(stranger.id, { nome: 'Outra' });
      const received = await seedBooking({
        consumidor: c.id,
        produtor: mine.id,
        experiencia: expMine._id,
      });
      await seedBooking({
        consumidor: c.id,
        produtor: stranger.id,
        experiencia: expStranger._id,
      });

      const res = await get('/received', mine.token).expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.itens[0]).toMatchObject({
        id: received._id.toHexString(),
        contraparte: { id: c.id.toHexString(), nome: 'Maria das Graças' },
        experiencia: { nome: 'Trilha guiada da nascente' },
      });
      expect(JSON.stringify(res.body)).not.toMatch(
        /@exemplo\.com|cpf|telefone|61999990000/i,
      );
    });

    it('a lista de consumidor nunca mostra o que ele recebeu como produtor', async () => {
      const { p } = await scenario();

      const res = await get('/mine', p.token).expect(403);

      expect(res.body).not.toHaveProperty('itens');
    });
  });

  describe('CA04: detalhe da solicitação', () => {
    it('consumidor e produtor da solicitação veem o mesmo registro, cada um com o seu outro lado', async () => {
      const { c, p, booking } = await scenario();
      const id = booking._id.toHexString();

      const asConsumer = await get(`/${id}`, c.token).expect(200);
      const asProducer = await get(`/${id}`, p.token).expect(200);

      expect(asConsumer.body).toMatchObject({
        id,
        status: 'pendente',
        participantes: 4,
        formaPagamento: 'pix',
        contraparte: {
          id: p.id.toHexString(),
          nome: 'Horta Comunitária Cafuringa',
        },
      });
      expect(asProducer.body).toMatchObject({
        id,
        contraparte: { id: c.id.toHexString(), nome: 'Maria das Graças' },
      });
    });

    it('experiência retirada da oferta: continua consultável, sem foto pública', async () => {
      const { c, exp, booking } = await scenario();
      await experiences().updateOne({ _id: exp._id }, { disponivel: false });

      const res = await get(`/${booking._id.toHexString()}`, c.token).expect(
        200,
      );

      expect(res.body.experiencia).toMatchObject({
        nome: 'Trilha guiada da nascente',
        disponivel: false,
      });
      expect(res.body.experiencia).not.toHaveProperty('foto');
    });
  });

  describe('CA05, RNF08: acesso restrito por perfil e vínculo', () => {
    it('404 para consumidor que não fez a solicitação', async () => {
      const { booking } = await scenario();
      const stranger = await consumer('Intrusa');

      const res = await get(
        `/${booking._id.toHexString()}`,
        stranger.token,
      ).expect(404);

      expect(JSON.stringify(res.body)).not.toContain('Horta');
    });

    it('404 para produtor sem vínculo com a experiência', async () => {
      const { booking } = await scenario();
      const stranger = await producer();

      await get(`/${booking._id.toHexString()}`, stranger.token).expect(404);
    });

    it('a resposta para terceiros é idêntica à de um id que não existe (não vaza existência)', async () => {
      const { booking } = await scenario();
      const stranger = await consumer('Intrusa');

      const real = await get(
        `/${booking._id.toHexString()}`,
        stranger.token,
      ).expect(404);
      const fake = await get(
        `/${new Types.ObjectId().toHexString()}`,
        stranger.token,
      ).expect(404);

      expect(real.body).toEqual(fake.body);
    });

    it.each(['abc', '123', '%20'])('404 para id inválido (%s)', async (id) => {
      const c = await consumer();

      await get(`/${id}`, c.token).expect(404);
    });

    it('o dono não vem da query: filtro `consumidor` é recusado', async () => {
      const { c, p } = await scenario();

      await get(`/mine?consumidor=${p.id.toHexString()}`, c.token).expect(400);
    });
  });

  describe('CA06: ausência de solicitações', () => {
    it('consumidor sem solicitações: 200 com lista vazia', async () => {
      const c = await consumer();

      const res = await get('/mine', c.token).expect(200);

      expect(res.body).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });

    it('produtor sem solicitações recebidas: 200 com lista vazia', async () => {
      const p = await producer();

      const res = await get('/received', p.token).expect(200);

      expect(res.body).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });
  });

  describe('CA07, RN21: situação atualmente registrada', () => {
    it('lista e detalhe mostram a mudança de situação assim que ela é gravada', async () => {
      const { c, p, booking } = await scenario();
      const id = booking._id.toHexString();
      expect((await get(`/${id}`, c.token).expect(200)).body.status).toBe(
        'pendente',
      );

      await bookings().updateOne(
        { _id: booking._id },
        { status: BookingStatus.ACEITA },
      );

      expect((await get(`/${id}`, c.token).expect(200)).body.status).toBe(
        'aceita',
      );
      expect(
        (await get('/mine', c.token).expect(200)).body.itens[0].status,
      ).toBe('aceita');
      expect(
        (await get('/received', p.token).expect(200)).body.itens[0].status,
      ).toBe('aceita');
    });

    it('filtra pela situação', async () => {
      const c = await consumer();
      const p = await producer();
      const exp = await experienceOf(p.id);
      const link = { consumidor: c.id, produtor: p.id, experiencia: exp._id };
      await seedBooking(link);
      const accepted = await seedBooking(link, {
        status: BookingStatus.ACEITA,
      });
      await seedBooking(link, { status: BookingStatus.CANCELADA });

      const mine = await get('/mine?status=aceita', c.token).expect(200);
      const received = await get('/received?status=aceita', p.token).expect(
        200,
      );

      for (const res of [mine, received]) {
        expect(res.body.total).toBe(1);
        expect(res.body.itens.map((i: { id: string }) => i.id)).toEqual([
          accepted._id.toHexString(),
        ]);
      }
    });

    it('400 para situação fora do ciclo de vida', async () => {
      const c = await consumer();

      const res = await get('/mine?status=concluida', c.token).expect(400);

      expect(res.body.message.join(' ')).toContain('Situação inválida');
    });

    it.each(['pagina=0', 'pagina=abc', 'limite=0', 'limite=51'])(
      '400 para paginação inválida (%s)',
      async (query) => {
        const c = await consumer();

        await get(`/mine?${query}`, c.token).expect(400);
      },
    );
  });

  describe('Desempenho: as consultas usam os índices de `bookings`', () => {
    async function plan(filter: Record<string, unknown>) {
      // Mesmos estágios que decidem o índice em `BookingsQueryService.list`.
      const explain = (await bookings()
        .aggregate([
          { $match: filter },
          { $sort: { criadoEm: -1, _id: -1 } },
          { $skip: 0 },
          { $limit: 20 },
        ])
        .explain('executionStats')) as {
        queryPlanner: { winningPlan: unknown };
      };
      // Só o plano vencedor: planos rejeitados podem citar SORT sem serem usados.
      return JSON.stringify(explain.queryPlanner.winningPlan);
    }

    it.each([
      ['consumidor', { consumidor: new Types.ObjectId() }],
      [
        'consumidor + status',
        { consumidor: new Types.ObjectId(), status: 'pendente' },
      ],
      ['produtor', { produtor: new Types.ObjectId() }],
      [
        'produtor + status',
        { produtor: new Types.ObjectId(), status: 'pendente' },
      ],
    ])('%s: varre índice e não ordena em memória', async (_caso, filter) => {
      const explain = await plan(filter);

      expect(explain).toMatch(/IXSCAN/);
      expect(explain).not.toMatch(/COLLSCAN/);
      expect(explain).not.toMatch(/"stage":"SORT"/);
    });
  });
});
