import type { ConfigService } from '@nestjs/config';
import type { MailService } from '../../common/mail/mail.service.js';
import type { MetricsRegistry } from '../metrics/metrics.registry.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { Experience } from '../experiences/schemas/experience.schema.js';
import type { User } from '../users/schemas/user.schema.js';
import { BookingsService } from './bookings.service.js';
import { BookingStatus, PaymentMethod } from './domain/booking.js';
import type { Booking } from './schemas/booking.schema.js';

const CREATED_AT = new Date('2026-11-21T13:30:05.000Z');
const NOW = new Date('2026-11-22T09:00:00.000Z');

function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

const consumerId = new Types.ObjectId();
const bookingId = new Types.ObjectId();
const experienceId = new Types.ObjectId();

function stored(status: BookingStatus) {
  return {
    _id: bookingId,
    consumidor: consumerId,
    experiencia: experienceId,
    produtor: new Types.ObjectId(),
    data: '2026-12-10',
    horario: '09:00',
    participantes: 4,
    formaPagamento: PaymentMethod.PIX,
    mensagem: 'Vamos com duas crianças.',
    status,
    criadoEm: CREATED_AT,
  };
}

function setup() {
  const bookings = {
    findOneAndUpdate: vi
      .fn()
      .mockReturnValue(query(stored(BookingStatus.CANCELADA))),
    findOne: vi.fn().mockReturnValue(query(null)),
  };
  const service = new BookingsService(
    bookings as unknown as Model<Booking>,
    {} as Model<Experience>,
    {} as Model<User>,
    {} as MailService,
    {} as ConfigService,
    {} as MetricsRegistry,
  );
  return { service, bookings };
}

describe('BookingsService.cancel (HU46/RF46)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('CA03: cancela, numa só operação, a solicitação pendente do próprio consumidor', async () => {
    const { service, bookings } = setup();

    await service.cancel(consumerId.toHexString(), bookingId.toHexString());

    expect(bookings.findOneAndUpdate).toHaveBeenCalledTimes(1);
    const [filter, update, options] = bookings.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({
      _id: bookingId,
      consumidor: consumerId,
      status: BookingStatus.PENDENTE,
    });
    expect(update).toEqual({
      $set: { status: BookingStatus.CANCELADA, canceladaEm: NOW },
    });
    expect(options).toMatchObject({ returnDocument: 'after' });
    expect(bookings.findOne).not.toHaveBeenCalled();
  });

  it('CA06: devolve a solicitação com a situação atualizada', async () => {
    const { service } = setup();

    const res = await service.cancel(
      consumerId.toHexString(),
      bookingId.toHexString(),
    );

    expect(res).toEqual({
      id: bookingId.toHexString(),
      experienciaId: experienceId.toHexString(),
      data: '2026-12-10',
      horario: '09:00',
      participantes: 4,
      formaPagamento: PaymentMethod.PIX,
      mensagem: 'Vamos com duas crianças.',
      status: BookingStatus.CANCELADA,
      criadoEm: CREATED_AT.toISOString(),
    });
  });

  it('RNF11: a resposta não traz consumidor nem produtor', async () => {
    const { service } = setup();

    const res = await service.cancel(
      consumerId.toHexString(),
      bookingId.toHexString(),
    );

    expect(res).not.toHaveProperty('consumidor');
    expect(res).not.toHaveProperty('produtor');
  });

  it.each(['abc', '', '64b0c0ffee0000000000b00', 'z'.repeat(24)])(
    'CA05: 404 sem consultar o banco quando o id %j não é válido',
    async (id) => {
      const { service, bookings } = setup();

      await expect(
        service.cancel(consumerId.toHexString(), id),
      ).rejects.toThrow(NotFoundException);
      expect(bookings.findOneAndUpdate).not.toHaveBeenCalled();
      expect(bookings.findOne).not.toHaveBeenCalled();
    },
  );

  it('CA05: 404 quando a solicitação não existe ou é de outro usuário', async () => {
    const { service, bookings } = setup();
    bookings.findOneAndUpdate.mockReturnValue(query(null));
    bookings.findOne.mockReturnValue(query(null));

    await expect(
      service.cancel(consumerId.toHexString(), bookingId.toHexString()),
    ).rejects.toThrow(NotFoundException);
    // A conferência de existência também fica restrita ao dono: não vaza terceiros.
    expect(bookings.findOne).toHaveBeenCalledWith({
      _id: bookingId,
      consumidor: consumerId,
    });
  });

  // RN20 revista em 25/11/2026: a aceita também se cancela (pagamento por Pix).
  it.each([
    [BookingStatus.RECUSADA, /recusada/i],
    [BookingStatus.CANCELADA, /já foi cancelada/i],
  ])(
    'RN20/RN21: 409 quando a solicitação está %s, sem alterá-la',
    async (status, message) => {
      const { service, bookings } = setup();
      bookings.findOneAndUpdate.mockReturnValue(query(null));
      bookings.findOne.mockReturnValue(query({ status }));

      const error = await service
        .cancel(consumerId.toHexString(), bookingId.toHexString())
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toMatch(message);
      // A única escrita é a condicional, que não casou: nada foi gravado.
      expect(bookings.findOneAndUpdate).toHaveBeenCalledTimes(1);
    },
  );

  it('CA07: falha do banco propaga o erro sem tratá-lo como sucesso nem como conflito', async () => {
    const { service, bookings } = setup();
    const failure = new Error('connection lost');
    const failing = query(null);
    failing.exec.mockRejectedValue(failure);
    bookings.findOneAndUpdate.mockReturnValue(failing);

    await expect(
      service.cancel(consumerId.toHexString(), bookingId.toHexString()),
    ).rejects.toBe(failure);
    expect(bookings.findOne).not.toHaveBeenCalled();
  });
});
