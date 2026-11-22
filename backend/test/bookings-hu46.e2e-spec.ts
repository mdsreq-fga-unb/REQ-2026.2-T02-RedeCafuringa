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

  // CA02 e CA04 (confirmar ou desistir) são da interface: "Manter solicitação"
  // simplesmente não chama este endpoint, então não há o que testar na API.

  describe('RN20, RN21: só pendente cancela; o resto responde 409 e nada muda', () => {
    it.each([
      [BookingStatus.ACEITA, 'apenas o produtor responsável pode cancelá-la'],
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

    it('cancelamento contra a resposta do produtor (HU47): ganha só um e o estado final é coerente', async () => {
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

        const final = (await stored(id))?.status;
        if (cancelRes.status === 200) {
          expect(accept.modifiedCount).toBe(0);
          expect(final).toBe(BookingStatus.CANCELADA);
        } else {
          expect(cancelRes.status).toBe(409);
          expect(accept.modifiedCount).toBe(1);
          expect(final).toBe(BookingStatus.ACEITA);
        }
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
