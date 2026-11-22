import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../domain/booking.js';

export const NOTIFIABLE_BOOKING_STATUSES = [
  BookingStatus.ACEITA,
  BookingStatus.RECUSADA,
  BookingStatus.CANCELADA,
] as const;

export class BookingNotificationResponse {
  @ApiProperty({ description: 'Identificador da alteração' })
  id: string;

  @ApiProperty({ description: 'Id da pré-reserva para abrir a consulta' })
  reservaId: string;

  @ApiProperty({ description: 'Código exibido na consulta' })
  codigo: string;

  @ApiProperty({ description: 'Nome da experiência solicitada' })
  experienciaNome: string;

  @ApiProperty({ description: 'Data da pré-reserva (AAAA-MM-DD)' })
  data: string;

  @ApiProperty({ description: 'Horário da pré-reserva (HH:MM)' })
  horario: string;

  @ApiProperty({ description: 'Quantidade de participantes' })
  participantes: number;

  @ApiProperty({
    enum: NOTIFIABLE_BOOKING_STATUSES,
    description: 'Situação registrada',
  })
  status: (typeof NOTIFIABLE_BOOKING_STATUSES)[number];
}
