process.env.AUTH_THROTTLE_LIMIT = '1000';

import { futureBookingDate, makeBooking } from '@test/factories';
import { getModelToken } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { Booking } from '../src/modules/bookings/schemas/booking.schema.js';
import { ExperienceCategory } from '../src/modules/experiences/domain/experience.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { User } from '../src/modules/users/schemas/user.schema.js';
import { loginAs, seedProducer } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('HU44/RF44 — Solicitar pré-reserva de experiência (e2e)', () => {
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

  const bookings = () => t.app.get<Model<Booking>>(getModelToken(Booking.name));
  const experiences = () =>
    t.app.get<Model<Experience>>(getModelToken(Experience.name));
  const users = () => t.app.get<Model<User>>(getModelToken(User.name));

  /** Experiência de um produtor ativo, gravada direto no banco (sem fotos reais). */
  async function seedExperience(
    overrides: Partial<Record<string, unknown>> = {},
  ) {
    const { user: producer } = await seedProducer(t);
    const experience = await experiences().create({
      produtor: producer._id,
      nome: 'Trilha guiada da nascente',
      categoria: ExperienceCategory.EXPERIENCIA,
      descricao: 'Caminhada de 3 km até a nascente.',
      valorCentavos: 4550,
      local: 'Sítio Boa Vista',
      duracao: '2 horas',
      fotos: [{ id: new Types.ObjectId(), versao: 'v1' }],
      ...overrides,
    });
    return {
      experienceId: experience._id.toHexString(),
      producerId: producer._id.toHexString(),
    };
  }

  function post(token: string | undefined, body: object) {
    const req = t.request().post(BOOKINGS);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send(body);
  }

  describe('CA05, CA06, RN19: consumidor envia e a solicitação fica pendente', () => {
    it('201 com a solicitação pendente, ligada ao consumidor, à experiência e ao produtor', async () => {
      const { experienceId, producerId } = await seedExperience();
      const token = await loginAs(t, Role.CONSUMIDOR);
      const payload = makeBooking({ experienciaId: experienceId });

      const res = await post(token, payload).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        experienciaId: experienceId,
        data: payload.data,
        horario: payload.horario,
        participantes: payload.participantes,
        formaPagamento: payload.formaPagamento,
        mensagem: payload.mensagem,
        status: 'pendente',
        criadoEm: expect.any(String),
      });

      const stored = await bookings().findById(res.body.id).lean().exec();
      expect(stored?.status).toBe('pendente');
      expect(stored?.experiencia.toString()).toBe(experienceId);
      expect(stored?.produtor.toString()).toBe(producerId);
      const consumer = await users()
        .findOne({ perfil: Role.CONSUMIDOR })
        .lean()
        .exec();
      expect(stored?.consumidor.toString()).toBe(consumer?._id.toString());
    });

    it('sem mensagem: 201 e o campo não aparece', async () => {
      const { experienceId } = await seedExperience();
      const token = await loginAs(t, Role.CONSUMIDOR);
      const { mensagem: _mensagem, ...payload } = makeBooking({
        experienciaId: experienceId,
      });

      const res = await post(token, payload).expect(201);

      expect(res.body).not.toHaveProperty('mensagem');
    });

    it('RNF11: a resposta não expõe dados do consumidor nem do produtor', async () => {
      const { experienceId } = await seedExperience();
      const token = await loginAs(t, Role.CONSUMIDOR);

      const res = await post(
        token,
        makeBooking({ experienciaId: experienceId }),
      ).expect(201);

      expect(res.body).not.toHaveProperty('consumidor');
      expect(res.body).not.toHaveProperty('produtor');
      expect(JSON.stringify(res.body)).not.toMatch(/email|cpf|telefone/i);
    });
  });

  describe('CA04: valida os dados antes de registrar', () => {
    it.each([
      ['data ausente', { data: undefined }, 'Informe a data desejada'],
      ['data inexistente', { data: '2026-02-30' }, 'Informe uma data válida'],
      ['horário fora da lista', { horario: '09:30' }, 'Escolha um horário'],
      [
        'participantes acima do limite',
        { participantes: 51 },
        'Informe de 1 a 50 participantes',
      ],
      [
        'forma de pagamento desconhecida',
        { formaPagamento: 'boleto' },
        'Escolha uma forma de pagamento da lista',
      ],
      [
        'experiência inválida',
        { experienciaId: 'abc' },
        'Experiência inválida',
      ],
    ])('400 com %s', async (_caso, override, message) => {
      const { experienceId } = await seedExperience();
      const token = await loginAs(t, Role.CONSUMIDOR);

      const res = await post(
        token,
        Object.assign(makeBooking({ experienciaId: experienceId }), override),
      ).expect(400);

      expect(res.body.message.join(' ')).toContain(message);
      expect(await bookings().countDocuments()).toBe(0);
    });

    it('400 quando a data já passou', async () => {
      const { experienceId } = await seedExperience();
      const token = await loginAs(t, Role.CONSUMIDOR);

      const res = await post(
        token,
        makeBooking({
          experienciaId: experienceId,
          data: futureBookingDate(-2),
        }),
      ).expect(400);

      expect(res.body.message).toEqual([
        'A data e o horário da pré-reserva não podem estar no passado',
      ]);
      expect(await bookings().countDocuments()).toBe(0);
    });

    it('RN19: recusa status ou consumidor enviados no corpo', async () => {
      const { experienceId } = await seedExperience();
      const token = await loginAs(t, Role.CONSUMIDOR);

      await post(
        token,
        Object.assign(makeBooking({ experienciaId: experienceId }), {
          status: 'aceita',
          consumidor: new Types.ObjectId().toHexString(),
        }),
      ).expect(400);

      expect(await bookings().countDocuments()).toBe(0);
    });
  });

  describe('CA07: experiência indisponível não recebe pré-reserva', () => {
    it('404 quando a experiência não existe', async () => {
      const token = await loginAs(t, Role.CONSUMIDOR);

      await post(token, makeBooking()).expect(404);
    });

    it('404 quando a experiência foi retirada da oferta', async () => {
      const { experienceId } = await seedExperience({ disponivel: false });
      const token = await loginAs(t, Role.CONSUMIDOR);

      await post(token, makeBooking({ experienciaId: experienceId })).expect(
        404,
      );
      expect(await bookings().countDocuments()).toBe(0);
    });

    it('404 quando o produtor responsável foi desativado', async () => {
      const { experienceId, producerId } = await seedExperience();
      await users().updateOne({ _id: producerId }, { ativo: false }).exec();
      const token = await loginAs(t, Role.CONSUMIDOR);

      await post(token, makeBooking({ experienciaId: experienceId })).expect(
        404,
      );
      expect(await bookings().countDocuments()).toBe(0);
    });
  });

  describe('RNF08: só consumidor autenticado solicita', () => {
    it('401 sem token', async () => {
      const { experienceId } = await seedExperience();

      await post(
        undefined,
        makeBooking({ experienciaId: experienceId }),
      ).expect(401);
    });

    it('401 com token inválido', async () => {
      const { experienceId } = await seedExperience();

      await post(
        'token-invalido',
        makeBooking({ experienciaId: experienceId }),
      ).expect(401);
    });

    it.each([Role.PRODUTOR, Role.ADMINISTRADOR])(
      '403 para o perfil %s',
      async (perfil) => {
        const { experienceId } = await seedExperience();
        const token = await loginAs(t, perfil);

        await post(token, makeBooking({ experienciaId: experienceId })).expect(
          403,
        );
        expect(await bookings().countDocuments()).toBe(0);
      },
    );
  });
});
