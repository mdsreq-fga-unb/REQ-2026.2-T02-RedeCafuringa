process.env.AUTH_THROTTLE_LIMIT = '1000';

import { futureBookingDate } from '@test/factories';
import { getModelToken } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  BookingStatus,
  PaymentMethod,
} from '../src/modules/bookings/domain/booking.js';
import { Booking } from '../src/modules/bookings/schemas/booking.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { loginAs, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('HU46/RF46 — Cancelar pré-reserva (e2e)', () => {
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

  /** Consumidor com sessão: token e id, para gravar solicitações em nome dele. */
  async function consumerSession() {
    const { user, email, senha } = await seedUser(t, Role.CONSUMIDOR);
    const res = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email, senha })
      .expect(200);
    return { id: user._id as Types.ObjectId, token: res.body.accessToken };
  }

  async function seedBooking(
    consumidor: Types.ObjectId,
    status: BookingStatus = BookingStatus.PENDENTE,
  ) {
    const doc = await bookings().create({
      consumidor,
      experiencia: new Types.ObjectId(),
      produtor: new Types.ObjectId(),
      data: futureBookingDate(),
      horario: '09:00',
      participantes: 4,
      formaPagamento: PaymentMethod.PIX,
      mensagem: 'Vamos com duas crianças.',
      status,
    });
    return doc._id.toHexString();
  }

  function cancel(token: string | undefined, id: string) {
    const req = t.request().patch(`${BOOKINGS}/${id}/cancel`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send();
  }

  const stored = (id: string) => bookings().findById(id).lean().exec();

  describe('CA02, CA03, CA06: consumidor confirma e a solicitação fica cancelada', () => {
    it('200 com a solicitação cancelada e a situação atualizada no banco', async () => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId);

      const res = await cancel(token, id).expect(200);

      expect(res.body).toEqual({
        id,
        experienciaId: expect.any(String),
        data: expect.any(String),
        horario: '09:00',
        participantes: 4,
        formaPagamento: 'pix',
        mensagem: 'Vamos com duas crianças.',
        status: 'cancelada',
        criadoEm: expect.any(String),
      });
      const after = await stored(id);
      expect(after?.status).toBe('cancelada');
      expect(after?.canceladaEm).toBeInstanceOf(Date);
    });

    it('CA06: a situação cancelada persiste para quem consultar depois', async () => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId);

      await cancel(token, id).expect(200);

      expect((await stored(id))?.status).toBe(BookingStatus.CANCELADA);
    });

    it('RNF11: a resposta não expõe dados do consumidor nem do produtor', async () => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId);

      const res = await cancel(token, id).expect(200);

      expect(res.body).not.toHaveProperty('consumidor');
      expect(res.body).not.toHaveProperty('produtor');
      expect(JSON.stringify(res.body)).not.toMatch(/email|cpf|telefone/i);
    });

    it('cancelar uma solicitação não mexe nas demais do mesmo consumidor', async () => {
      const { id: consumerId, token } = await consumerSession();
      const alvo = await seedBooking(consumerId);
      const outra = await seedBooking(consumerId);

      await cancel(token, alvo).expect(200);

      expect((await stored(outra))?.status).toBe(BookingStatus.PENDENTE);
    });
  });

  it('HU48: lista somente alterações gravadas e vinculadas à conta', async () => {
    const { id: consumerId, token } = await consumerSession();
    const { id: otherId } = await consumerSession();
    const cancelled = await seedBooking(consumerId);
    await seedBooking(consumerId);
    await seedBooking(otherId, BookingStatus.ACEITA);

    const notifications = () =>
      t
        .request()
        .get(`${BOOKINGS}/notifications`)
        .set('Authorization', `Bearer ${token}`);

    expect((await notifications().expect(200)).body).toEqual([]);
    await cancel(token, cancelled).expect(200);
    await cancel(token, cancelled).expect(409);
    const response = await notifications()
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(response.body).toEqual([
      {
        id: `${cancelled}:cancelada`,
        reservaId: cancelled,
        codigo: `CAF-${cancelled.slice(-6).toUpperCase()}`,
        experienciaNome: 'Experiência indisponível',
        data: expect.any(String),
        horario: '09:00',
        participantes: 4,
        status: 'cancelada',
      },
    ]);
    await t.request().get(`${BOOKINGS}/notifications`).expect(401);
  });

  it('HU48: devolve no máximo as 50 alterações mais recentes, da mais nova à mais antiga', async () => {
    const { id: consumerId, token } = await consumerSession();
    const ids: string[] = [];
    for (let i = 0; i < 55; i += 1) {
      ids.push(await seedBooking(consumerId, BookingStatus.RECUSADA));
    }

    const response = await t
      .request()
      .get(`${BOOKINGS}/notifications`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(50);
    expect(response.body[0].reservaId).toBe(ids[54]);
    expect(response.body[49].reservaId).toBe(ids[5]);
  });

  // CA02 e CA04 (confirmar ou desistir) são da interface: "Manter solicitação"
  // simplesmente não chama este endpoint, então não há o que testar na API.

  // RN20 revista em 25/11/2026 (pagamento por Pix): a aceita também se cancela.
  describe('RN20, RN21: recusada e cancelada respondem 409 e nada muda', () => {
    it.each([
      [BookingStatus.RECUSADA, 'foi recusada pelo produtor'],
      [BookingStatus.CANCELADA, 'já foi cancelada'],
    ])('409 quando está %s', async (status, message) => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId, status);

      const res = await cancel(token, id).expect(409);

      expect(res.body.message).toContain(message);
      const after = await stored(id);
      expect(after?.status).toBe(status);
      expect(after?.canceladaEm).toBeUndefined();
    });

    it('cancelar duas vezes: a segunda é 409 e preserva o instante do primeiro cancelamento', async () => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId);
      await cancel(token, id).expect(200);
      const first = (await stored(id))?.canceladaEm;

      await cancel(token, id).expect(409);

      expect((await stored(id))?.canceladaEm).toEqual(first);
    });
  });

  describe('CA05, RNF08: só o dono cancela', () => {
    it('404 para a solicitação de outro consumidor, que segue intacta', async () => {
      const { id: ownerId } = await consumerSession();
      const { token: strangerToken } = await consumerSession();
      const id = await seedBooking(ownerId);

      const res = await cancel(strangerToken, id).expect(404);

      expect(res.body.message).toBe('Pré-reserva não encontrada');
      expect((await stored(id))?.status).toBe(BookingStatus.PENDENTE);
    });

    it('terceiro e id inexistente respondem igual: não vaza que a solicitação existe', async () => {
      const { id: ownerId } = await consumerSession();
      const { token: strangerToken } = await consumerSession();
      const id = await seedBooking(ownerId);

      const ofOther = await cancel(strangerToken, id).expect(404);
      const missing = await cancel(
        strangerToken,
        new Types.ObjectId().toHexString(),
      ).expect(404);

      expect(ofOther.body).toEqual(missing.body);
    });

    it('terceiro não descobre a situação: 404 mesmo se a solicitação já estiver aceita', async () => {
      const { id: ownerId } = await consumerSession();
      const { token: strangerToken } = await consumerSession();
      const id = await seedBooking(ownerId, BookingStatus.ACEITA);

      await cancel(strangerToken, id).expect(404);
    });

    it('404 para id que não é um ObjectId', async () => {
      const { token } = await consumerSession();

      await cancel(token, 'abc').expect(404);
    });

    it('401 sem token', async () => {
      const { id: consumerId } = await consumerSession();
      const id = await seedBooking(consumerId);

      await cancel(undefined, id).expect(401);
      expect((await stored(id))?.status).toBe(BookingStatus.PENDENTE);
    });

    it('401 com token inválido', async () => {
      const { id: consumerId } = await consumerSession();
      const id = await seedBooking(consumerId);

      await cancel('token-invalido', id).expect(401);
    });

    it.each([Role.PRODUTOR, Role.ADMINISTRADOR])(
      '403 para o perfil %s, sem alterar a solicitação',
      async (perfil) => {
        const { id: consumerId } = await consumerSession();
        const id = await seedBooking(consumerId);
        const token = await loginAs(t, perfil);

        await cancel(token, id).expect(403);
        expect((await stored(id))?.status).toBe(BookingStatus.PENDENTE);
      },
    );
  });

  describe('Atomicidade: um único vencedor', () => {
    it('cinco cancelamentos simultâneos: um 200 e quatro 409', async () => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId);

      const results = await Promise.all(
        Array.from({ length: 5 }, () => cancel(token, id)),
      );

      const statuses = results.map((r) => r.status).sort((a, b) => a - b);
      expect(statuses).toEqual([200, 409, 409, 409, 409]);
      expect((await stored(id))?.status).toBe(BookingStatus.CANCELADA);
    });

    it('cancelamento contra o aceite do produtor (HU47): o cancelamento sempre vale', async () => {
      // Repete para exercitar as duas ordens de chegada.
      for (let i = 0; i < 10; i++) {
        const { id: consumerId, token } = await consumerSession();
        const id = await seedBooking(consumerId);

        // Aceite condicional em `pendente`, como a HU47 deve fazer.
        const [cancelRes, accept] = await Promise.all([
          cancel(token, id),
          bookings()
            .updateOne(
              { _id: id, status: BookingStatus.PENDENTE },
              { $set: { status: BookingStatus.ACEITA } },
            )
            .exec(),
        ]);

        // Antes ou depois do aceite, a consumidora pode cancelar; nunca fica
        // aceita depois de um cancelamento confirmado.
        expect(cancelRes.status).toBe(200);
        expect(accept.modifiedCount).toBeLessThanOrEqual(1);
        expect((await stored(id))?.status).toBe(BookingStatus.CANCELADA);
      }
    });
  });

  describe('CA07: falha no processamento mantém a situação anterior', () => {
    it('500 e a solicitação segue pendente quando a gravação falha', async () => {
      const { id: consumerId, token } = await consumerSession();
      const id = await seedBooking(consumerId);
      const spy = vi
        .spyOn(bookings(), 'findOneAndUpdate')
        .mockImplementationOnce((() => ({
          lean: () => ({
            exec: () => Promise.reject(new Error('connection lost')),
          }),
        })) as never);

      try {
        const res = await cancel(token, id).expect(500);
        expect(JSON.stringify(res.body)).not.toContain('connection lost');
      } finally {
        spy.mockRestore();
      }

      const after = await stored(id);
      expect(after?.status).toBe(BookingStatus.PENDENTE);
      expect(after?.canceladaEm).toBeUndefined();
      // Depois da falha o consumidor consegue tentar de novo.
      await cancel(token, id).expect(200);
    });
  });
});
