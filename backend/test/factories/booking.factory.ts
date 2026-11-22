import { Types } from 'mongoose';
import { PaymentMethod } from '../../src/modules/bookings/domain/booking.js';
import type { CreateBookingDto } from '../../src/modules/bookings/dto/create-booking.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dia (AAAA-MM-DD) daqui a `dias` dias, longe o bastante para nunca estar no passado. */
export function futureBookingDate(dias = 30): string {
  return new Date(Date.now() + dias * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Payload válido de pré-reserva (HU44). Passe o `experienciaId` de uma
 * experiência cadastrada no teste; o padrão é um id que não existe.
 */
export function makeBooking(
  overrides: Partial<CreateBookingDto> = {},
): CreateBookingDto {
  return {
    experienciaId: new Types.ObjectId().toHexString(),
    data: futureBookingDate(),
    horario: '09:00',
    participantes: 4,
    formaPagamento: PaymentMethod.PIX,
    mensagem: 'Vamos com duas crianças.',
    ...overrides,
  };
}
