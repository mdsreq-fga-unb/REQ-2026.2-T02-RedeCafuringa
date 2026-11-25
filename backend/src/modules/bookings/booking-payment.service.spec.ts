import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { BookingPaymentService } from './booking-payment.service.js';
import { BookingStatus } from './domain/booking.js';
import { PaymentStatus } from './domain/booking-payment.js';
import type { Booking } from './schemas/booking.schema.js';

const NOW = new Date('2026-11-21T12:00:00.000Z');
const PRAZO = new Date('2026-11-22T12:00:00.000Z');

function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

const id = new Types.ObjectId();
const consumerId = new Types.ObjectId();
const producerId = new Types.ObjectId();

const pagamento = {
  valorPorPessoaCentavos: 4550,
  totalCentavos: 18200,
  sinalCentavos: 9100,
  restanteCentavos: 9100,
  situacao: PaymentStatus.AGUARDANDO_SINAL,
  aceitaEm: new Date('2026-11-21T11:00:00.000Z'),
  prazoSinal: PRAZO,
};

const booking = (overrides: Record<string, unknown> = {}) => ({
  _id: id,
  consumidor: consumerId,
  produtor: producerId,
  status: BookingStatus.ACEITA,
  pagamento,
  ...overrides,
});

function setup() {
  const bookings = {
    findOneAndUpdate: vi.fn().mockReturnValue(query(null)),
    findById: vi.fn().mockReturnValue(query(null)),
  };
  const service = new BookingPaymentService(
    bookings as unknown as Model<Booking>,
  );
  return { service, bookings };
}

const callOf = (bookings: { findOneAndUpdate: ReturnType<typeof vi.fn> }) =>
  bookings.findOneAndUpdate.mock.calls[0] as [
    Record<string, unknown>,
    Record<string, Record<string, unknown>>,
  ];

describe('BookingPaymentService — pagamento do sinal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('a consumidora avisa que pagou', () => {
    it('só vale para a própria pré-reserva aceita, com o sinal por pagar e dentro do prazo', async () => {
      const { service, bookings } = setup();
      bookings.findOneAndUpdate.mockReturnValue(
        query(
          booking({
            pagamento: {
              ...pagamento,
              situacao: PaymentStatus.COMPROVANTE_ENVIADO,
            },
          }),
        ),
      );

      const res = await service.reportSent(
        consumerId.toHexString(),
        id.toHexString(),
      );

      const [filter, update] = callOf(bookings);
      expect(filter).toEqual({
        _id: id,
        consumidor: consumerId,
        status: BookingStatus.ACEITA,
        'pagamento.situacao': PaymentStatus.AGUARDANDO_SINAL,
        'pagamento.prazoSinal': { $gte: NOW },
      });
      expect(update.$set).toEqual({
        'pagamento.situacao': PaymentStatus.COMPROVANTE_ENVIADO,
        'pagamento.comprovanteAvisadoEm': NOW,
      });
      expect(res).toEqual({
        total: 182,
        sinal: 91,
        restante: 91,
        situacao: PaymentStatus.COMPROVANTE_ENVIADO,
        prazoSinal: PRAZO.toISOString(),
      });
    });

    it('pré-reserva de outra conta ou inexistente: 404', async () => {
      const { service, bookings } = setup();
      bookings.findById.mockReturnValue(
        query(booking({ consumidor: new Types.ObjectId() })),
      );

      await expect(
        service.reportSent(consumerId.toHexString(), id.toHexString()),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.reportSent(consumerId.toHexString(), 'abc'),
      ).rejects.toThrow(NotFoundException);
    });

    it('situação que não permite: 409 com o motivo', async () => {
      const { service, bookings } = setup();
      bookings.findById.mockReturnValue(
        query(
          booking({
            pagamento: {
              ...pagamento,
              prazoSinal: new Date('2026-11-20T00:00:00.000Z'),
            },
          }),
        ),
      );

      await expect(
        service.reportSent(consumerId.toHexString(), id.toHexString()),
      ).rejects.toThrow(
        new ConflictException(
          'O prazo para pagar o sinal terminou. Fale com a produtora.',
        ),
      );
    });
  });

  describe('a produtora confirma o sinal', () => {
    it('vale com o sinal por pagar ou com o aviso da consumidora, mesmo depois do prazo', async () => {
      const { service, bookings } = setup();
      bookings.findOneAndUpdate.mockReturnValue(
        query(
          booking({
            pagamento: {
              ...pagamento,
              situacao: PaymentStatus.SINAL_CONFIRMADO,
            },
          }),
        ),
      );

      const res = await service.confirm(
        producerId.toHexString(),
        id.toHexString(),
      );

      const [filter, update] = callOf(bookings);
      expect(filter).toEqual({
        _id: id,
        produtor: {
          $in: [producerId, producerId.toHexString()],
        },
        status: BookingStatus.ACEITA,
        'pagamento.situacao': {
          $in: [
            PaymentStatus.AGUARDANDO_SINAL,
            PaymentStatus.COMPROVANTE_ENVIADO,
          ],
        },
      });
      expect(update.$set).toEqual({
        'pagamento.situacao': PaymentStatus.SINAL_CONFIRMADO,
        'pagamento.sinalConfirmadoEm': NOW,
      });
      expect(res.situacao).toBe(PaymentStatus.SINAL_CONFIRMADO);
    });

    it('pré-reserva de outra produtora: 403', async () => {
      const { service, bookings } = setup();
      bookings.findById.mockReturnValue(
        query(booking({ produtor: new Types.ObjectId() })),
      );

      await expect(
        service.confirm(producerId.toHexString(), id.toHexString()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('inexistente: 404; já confirmado: 409', async () => {
      const { service, bookings } = setup();
      await expect(
        service.confirm(producerId.toHexString(), id.toHexString()),
      ).rejects.toThrow(NotFoundException);

      bookings.findById.mockReturnValue(
        query(
          booking({
            pagamento: {
              ...pagamento,
              situacao: PaymentStatus.SINAL_CONFIRMADO,
            },
          }),
        ),
      );
      await expect(
        service.confirm(producerId.toHexString(), id.toHexString()),
      ).rejects.toThrow(
        new ConflictException('O sinal desta pré-reserva já foi confirmado.'),
      );
    });
  });

  describe('a produtora não encontrou o pagamento', () => {
    it('volta a aguardar o sinal, com o prazo de antes', async () => {
      const { service, bookings } = setup();
      bookings.findOneAndUpdate.mockReturnValue(query(booking()));

      const res = await service.reportNotFound(
        producerId.toHexString(),
        id.toHexString(),
      );

      const [filter, update] = callOf(bookings);
      expect(filter['pagamento.situacao']).toBe(
        PaymentStatus.COMPROVANTE_ENVIADO,
      );
      expect(update).toEqual({
        $set: { 'pagamento.situacao': PaymentStatus.AGUARDANDO_SINAL },
        $unset: { 'pagamento.comprovanteAvisadoEm': 1 },
      });
      expect(res.situacao).toBe(PaymentStatus.AGUARDANDO_SINAL);
    });

    it('sem aviso da consumidora: 409 com o motivo', async () => {
      const { service, bookings } = setup();
      bookings.findById.mockReturnValue(query(booking()));

      await expect(
        service.reportNotFound(producerId.toHexString(), id.toHexString()),
      ).rejects.toThrow(
        new ConflictException(
          'A consumidora ainda não avisou que pagou o sinal.',
        ),
      );
    });
  });
});

describe('BookingPaymentService — a produtora devolveu o sinal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const cancelada = (extra: Record<string, unknown> = {}) =>
    booking({
      status: BookingStatus.CANCELADA,
      pagamento: {
        ...pagamento,
        situacao: PaymentStatus.SINAL_CONFIRMADO,
        sinalNoCancelamento: 'devolver',
        ...extra,
      },
    });

  it('registra a devolução, uma vez só', async () => {
    const { service, bookings } = setup();
    bookings.findOneAndUpdate.mockReturnValue(
      query(cancelada({ devolvidoEm: NOW })),
    );

    const res = await service.reportRefunded(
      producerId.toHexString(),
      id.toHexString(),
    );

    const [filter, update] = callOf(bookings);
    expect(filter).toEqual({
      _id: id,
      produtor: { $in: [producerId, producerId.toHexString()] },
      status: BookingStatus.CANCELADA,
      'pagamento.sinalNoCancelamento': 'devolver',
      'pagamento.devolvidoEm': { $exists: false },
    });
    expect(update.$set).toEqual({ 'pagamento.devolvidoEm': NOW });
    expect(res.devolucao).toBe('feita');
  });

  it.each([
    [
      'não havia sinal a devolver',
      booking({ status: BookingStatus.CANCELADA }),
      'Não há sinal a devolver nesta pré-reserva.',
    ],
    [
      'o sinal ficou com a produtora',
      booking({
        status: BookingStatus.CANCELADA,
        pagamento: { ...pagamento, sinalNoCancelamento: 'retido' },
      }),
      'Não há sinal a devolver nesta pré-reserva.',
    ],
    [
      'a devolução já foi registrada',
      cancelada({ devolvidoEm: NOW }),
      'A devolução do sinal já foi registrada.',
    ],
  ])('%s: 409 com o motivo', async (_caso, current, message) => {
    const { service, bookings } = setup();
    bookings.findById.mockReturnValue(query(current));

    await expect(
      service.reportRefunded(producerId.toHexString(), id.toHexString()),
    ).rejects.toThrow(new ConflictException(message));
  });

  it('de outra produtora: 403', async () => {
    const { service, bookings } = setup();
    bookings.findById.mockReturnValue(
      query({ ...cancelada(), produtor: new Types.ObjectId() }),
    );

    await expect(
      service.reportRefunded(producerId.toHexString(), id.toHexString()),
    ).rejects.toThrow(ForbiddenException);
  });
});
