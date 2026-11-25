import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { bookingProducerFilter, BookingStatus } from './domain/booking.js';
import {
  type PaymentAction,
  paymentActionError,
  PaymentStatus,
  paymentView,
} from './domain/booking-payment.js';
import type { BookingPaymentResponse } from './dto/booking-detail.response.js';
import { Booking, type BookingPayment } from './schemas/booking.schema.js';

const NOT_FOUND = 'Pré-reserva não encontrada.';
const FORBIDDEN =
  'Você não tem permissão para alterar o pagamento desta pré-reserva.';
const RETRY = 'Não foi possível atualizar o pagamento. Tente novamente.';

type Current = Pick<
  Booking,
  'consumidor' | 'produtor' | 'status' | 'pagamento'
>;

/**
 * Pagamento do sinal por Pix: a consumidora avisa que pagou (o comprovante vai
 * pelo WhatsApp) e a produtora confirma ou contesta, depois de olhar o extrato.
 * A plataforma não recebe dinheiro; só registra o que cada lado informou.
 *
 * Cada ação é uma única escrita condicionada à situação atual: duas ações ao
 * mesmo tempo têm exatamente um vencedor.
 */
@Injectable()
export class BookingPaymentService {
  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
  ) {}

  /** A consumidora avisa que pagou, dentro do prazo. Outra conta: 404. */
  async reportSent(
    userId: string,
    id: string,
  ): Promise<BookingPaymentResponse> {
    const bookingId = this.validId(id);
    const consumer = new Types.ObjectId(userId);
    const now = new Date();
    const updated = await this.update(
      {
        _id: bookingId,
        consumidor: consumer,
        status: BookingStatus.ACEITA,
        'pagamento.situacao': PaymentStatus.AGUARDANDO_SINAL,
        'pagamento.prazoSinal': { $gte: now },
      },
      {
        $set: {
          'pagamento.situacao': PaymentStatus.COMPROVANTE_ENVIADO,
          'pagamento.comprovanteAvisadoEm': now,
        },
      },
    );
    if (updated) return paymentView(updated, now);

    const current = await this.current(bookingId);
    if (!current || !consumer.equals(current.consumidor))
      throw new NotFoundException(NOT_FOUND);
    throw this.conflict('enviar-comprovante', current, now);
  }

  /** A produtora confirma o sinal, mesmo depois do prazo. Outra produtora: 403. */
  async confirm(
    producerId: string,
    id: string,
  ): Promise<BookingPaymentResponse> {
    const bookingId = this.validId(id);
    const now = new Date();
    const updated = await this.update(
      {
        _id: bookingId,
        produtor: bookingProducerFilter(producerId),
        status: BookingStatus.ACEITA,
        'pagamento.situacao': {
          $in: [
            PaymentStatus.AGUARDANDO_SINAL,
            PaymentStatus.COMPROVANTE_ENVIADO,
          ],
        },
      },
      {
        $set: {
          'pagamento.situacao': PaymentStatus.SINAL_CONFIRMADO,
          'pagamento.sinalConfirmadoEm': now,
        },
      },
    );
    if (updated) return paymentView(updated, now);
    throw await this.producerFailure('confirmar-sinal', producerId, bookingId);
  }

  /** A produtora não achou o Pix no extrato: volta a aguardar, com o prazo de antes. */
  async reportNotFound(
    producerId: string,
    id: string,
  ): Promise<BookingPaymentResponse> {
    const bookingId = this.validId(id);
    const updated = await this.update(
      {
        _id: bookingId,
        produtor: bookingProducerFilter(producerId),
        status: BookingStatus.ACEITA,
        'pagamento.situacao': PaymentStatus.COMPROVANTE_ENVIADO,
      },
      {
        $set: { 'pagamento.situacao': PaymentStatus.AGUARDANDO_SINAL },
        $unset: { 'pagamento.comprovanteAvisadoEm': 1 },
      },
    );
    if (updated) return paymentView(updated);
    throw await this.producerFailure('nao-encontrado', producerId, bookingId);
  }

  /** Depois do cancelamento, a produtora registra que devolveu o sinal (uma vez só). */
  async reportRefunded(
    producerId: string,
    id: string,
  ): Promise<BookingPaymentResponse> {
    const bookingId = this.validId(id);
    const updated = await this.update(
      {
        _id: bookingId,
        produtor: bookingProducerFilter(producerId),
        status: BookingStatus.CANCELADA,
        'pagamento.sinalNoCancelamento': 'devolver',
        'pagamento.devolvidoEm': { $exists: false },
      },
      { $set: { 'pagamento.devolvidoEm': new Date() } },
    );
    if (updated) return paymentView(updated);

    const current = await this.current(bookingId);
    if (!current) throw new NotFoundException(NOT_FOUND);
    if (String(current.produtor) !== producerId)
      throw new ForbiddenException(FORBIDDEN);
    throw new ConflictException(
      current.status === BookingStatus.CANCELADA &&
        current.pagamento?.sinalNoCancelamento === 'devolver' &&
        current.pagamento.devolvidoEm
        ? 'A devolução do sinal já foi registrada.'
        : 'Não há sinal a devolver nesta pré-reserva.',
    );
  }

  private validId(id: string): Types.ObjectId {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException(NOT_FOUND);
    return new Types.ObjectId(id);
  }

  private async update(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<BookingPayment | undefined> {
    const booking = await this.bookings
      .findOneAndUpdate(filter, update, { returnDocument: 'after' })
      .lean<Booking>()
      .exec();
    return booking?.pagamento;
  }

  private current(bookingId: Types.ObjectId) {
    return this.bookings
      .findById(bookingId)
      .select('consumidor produtor status pagamento')
      .lean<Current>()
      .exec();
  }

  /** Nada foi gravado: inexistente (404), de outra produtora (403) ou situação errada (409). */
  private async producerFailure(
    acao: PaymentAction,
    producerId: string,
    bookingId: Types.ObjectId,
  ): Promise<Error> {
    const current = await this.current(bookingId);
    if (!current) return new NotFoundException(NOT_FOUND);
    if (String(current.produtor) !== producerId)
      return new ForbiddenException(FORBIDDEN);
    return this.conflict(acao, current);
  }

  private conflict(acao: PaymentAction, current: Current, now = new Date()) {
    return new ConflictException(
      paymentActionError(acao, current, now) ?? RETRY,
    );
  }
}
