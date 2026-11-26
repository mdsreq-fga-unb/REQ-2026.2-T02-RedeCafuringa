import type { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { MailService } from '../../common/mail/mail.service.js';
import type { Experience } from '../experiences/schemas/experience.schema.js';
import type { MetricsRegistry } from '../metrics/metrics.registry.js';
import type { User } from '../users/schemas/user.schema.js';
import { BookingsService } from './bookings.service.js';
import { BookingStatus, PaymentMethod } from './domain/booking.js';
import { PaymentStatus } from './domain/booking-payment.js';
import type { Booking } from './schemas/booking.schema.js';

// 22/11/2026 09:00 UTC; a experiência é em 10/12/2026 às 09:00 de Brasília.
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
const producerId = new Types.ObjectId();
const bookingId = new Types.ObjectId();

const pagamento = (situacao = PaymentStatus.SINAL_CONFIRMADO) => ({
  valorPorPessoaCentavos: 4550,
  totalCentavos: 18200,
  sinalCentavos: 9100,
  restanteCentavos: 9100,
  situacao,
  aceitaEm: new Date('2026-11-21T09:00:00.000Z'),
});

function stored(overrides: Record<string, unknown> = {}) {
  return {
    _id: bookingId,
    consumidor: consumerId,
    experiencia: new Types.ObjectId(),
    produtor: producerId,
    data: '2026-12-10',
    horario: '09:00',
    participantes: 4,
    formaPagamento: PaymentMethod.PIX,
    status: BookingStatus.ACEITA,
    pagamento: pagamento(),
    criadoEm: new Date('2026-11-20T09:00:00.000Z'),
    ...overrides,
  };
}

function setup() {
  const bookings = {
    findOneAndUpdate: vi.fn().mockReturnValue(query(null)),
    findOne: vi.fn().mockReturnValue(query(stored())),
    findById: vi.fn().mockReturnValue(query(stored())),
  };
  const service = new BookingsService(
    bookings as unknown as Model<Booking>,
    {} as Model<Experience>,
    {
      findById: vi.fn().mockReturnValue(query(null)),
    } as unknown as Model<User>,
    { send: vi.fn() } as unknown as MailService,
    { get: vi.fn() } as unknown as ConfigService,
    { recordMailFailure: vi.fn() } as unknown as MetricsRegistry,
  );
  return { service, bookings };
}

/** A segunda escrita é a do cancelamento da aceita (a primeira tenta a pendente). */
const acceptedCancelCall = (bookings: {
  findOneAndUpdate: ReturnType<typeof vi.fn>;
}) =>
  bookings.findOneAndUpdate.mock.calls[1] as [
    Record<string, unknown>,
    { $set: Record<string, unknown> },
  ];

describe('BookingsService — consumidora cancela a pré-reserva aceita (RN20 revista)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('com 72 horas ou mais: cancela e registra que a produtora devolve o sinal', async () => {
    const { service, bookings } = setup();
    bookings.findOneAndUpdate
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(stored({ status: BookingStatus.CANCELADA })));

    const res = await service.cancel(
      consumerId.toHexString(),
      bookingId.toHexString(),
    );

    const [filter, update] = acceptedCancelCall(bookings);
    expect(filter).toEqual({
      _id: bookingId,
      consumidor: consumerId,
      status: BookingStatus.ACEITA,
      'pagamento.situacao': PaymentStatus.SINAL_CONFIRMADO,
    });
    expect(update.$set).toEqual({
      status: BookingStatus.CANCELADA,
      canceladaEm: NOW,
      canceladaPor: 'consumidora',
      'pagamento.sinalNoCancelamento': 'devolver',
    });
    expect(res.status).toBe(BookingStatus.CANCELADA);
    expect(res.sinal).toEqual({ resultado: 'devolver', valor: 91 });
  });

  it('com menos de 72 horas: o sinal fica com a produtora', async () => {
    const { service, bookings } = setup();
    bookings.findOne.mockReturnValue(query(stored({ data: '2026-11-23' })));
    bookings.findOneAndUpdate
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(stored({ status: BookingStatus.CANCELADA })));

    const res = await service.cancel(
      consumerId.toHexString(),
      bookingId.toHexString(),
    );

    expect(acceptedCancelCall(bookings)[1].$set).toMatchObject({
      'pagamento.sinalNoCancelamento': 'retido',
    });
    expect(res.sinal).toEqual({ resultado: 'retido', valor: 91 });
  });

  it('sinal ainda não pago: cancela sem nada a devolver', async () => {
    const { service, bookings } = setup();
    bookings.findOne.mockReturnValue(
      query(stored({ pagamento: pagamento(PaymentStatus.AGUARDANDO_SINAL) })),
    );
    bookings.findOneAndUpdate
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(stored({ status: BookingStatus.CANCELADA })));

    const res = await service.cancel(
      consumerId.toHexString(),
      bookingId.toHexString(),
    );

    expect(acceptedCancelCall(bookings)[1].$set).not.toHaveProperty(
      'pagamento.sinalNoCancelamento',
    );
    expect(res).not.toHaveProperty('sinal');
  });

  it('aceita antiga, sem pagamento: a condição casa a ausência do sinal', async () => {
    const { service, bookings } = setup();
    bookings.findOne.mockReturnValue(query(stored({ pagamento: undefined })));
    bookings.findOneAndUpdate
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(stored({ status: BookingStatus.CANCELADA })));

    await service.cancel(consumerId.toHexString(), bookingId.toHexString());

    expect(acceptedCancelCall(bookings)[0]['pagamento.situacao']).toBeNull();
  });

  it('se a situação mudou entre a leitura e a gravação: 409 e nada muda', async () => {
    const { service } = setup();

    await expect(
      service.cancel(consumerId.toHexString(), bookingId.toHexString()),
    ).rejects.toThrow(
      new ConflictException(
        'A situação da pré-reserva mudou. Confira e tente de novo.',
      ),
    );
  });
});

describe('BookingsService — produtora cancela a pré-reserva aceita', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancela e registra que ela devolve o sinal, mesmo perto da data', async () => {
    const { service, bookings } = setup();
    bookings.findById.mockReturnValue(
      query(stored({ data: '2026-11-22', horario: '10:00' })),
    );
    bookings.findOneAndUpdate.mockReturnValue(
      query(stored({ status: BookingStatus.CANCELADA })),
    );

    const res = await service.cancelByProducer(
      producerId.toHexString(),
      bookingId.toHexString(),
    );

    const [filter, update] = bookings.findOneAndUpdate.mock.calls[0] as [
      Record<string, unknown>,
      { $set: Record<string, unknown> },
    ];
    expect(filter).toEqual({
      _id: bookingId,
      produtor: { $in: [producerId, producerId.toHexString()] },
      status: BookingStatus.ACEITA,
      'pagamento.situacao': PaymentStatus.SINAL_CONFIRMADO,
    });
    expect(update.$set).toEqual({
      status: BookingStatus.CANCELADA,
      canceladaEm: NOW,
      canceladaPor: 'produtora',
      'pagamento.sinalNoCancelamento': 'devolver',
    });
    expect(res.sinal).toEqual({ resultado: 'devolver', valor: 91 });
  });

  it.each([
    [
      BookingStatus.PENDENTE,
      'Esta pré-reserva ainda está pendente: responda aceitando ou recusando.',
    ],
    [
      BookingStatus.RECUSADA,
      'Esta pré-reserva foi recusada e não pode ser cancelada.',
    ],
    [BookingStatus.CANCELADA, 'Esta pré-reserva já foi cancelada.'],
  ])('%s: 409 com o motivo', async (status, message) => {
    const { service, bookings } = setup();
    bookings.findById.mockReturnValue(query(stored({ status })));

    await expect(
      service.cancelByProducer(
        producerId.toHexString(),
        bookingId.toHexString(),
      ),
    ).rejects.toThrow(new ConflictException(message));
    expect(bookings.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('de outra produtora: 403; inexistente ou id inválido: 404', async () => {
    const { service, bookings } = setup();
    bookings.findById.mockReturnValue(
      query(stored({ produtor: new Types.ObjectId() })),
    );
    await expect(
      service.cancelByProducer(
        producerId.toHexString(),
        bookingId.toHexString(),
      ),
    ).rejects.toThrow(ForbiddenException);

    bookings.findById.mockReturnValue(query(null));
    await expect(
      service.cancelByProducer(
        producerId.toHexString(),
        bookingId.toHexString(),
      ),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.cancelByProducer(producerId.toHexString(), 'abc'),
    ).rejects.toThrow(NotFoundException);
  });

  it('se a situação mudou entre a leitura e a gravação: 409', async () => {
    const { service } = setup();

    await expect(
      service.cancelByProducer(
        producerId.toHexString(),
        bookingId.toHexString(),
      ),
    ).rejects.toThrow(
      new ConflictException(
        'A situação da pré-reserva mudou. Confira e tente de novo.',
      ),
    );
  });
});
