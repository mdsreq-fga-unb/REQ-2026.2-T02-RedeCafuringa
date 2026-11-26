import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../domain/booking.js';
import { PaymentStatus } from '../domain/booking-payment.js';

export const NOTIFIABLE_BOOKING_STATUSES = [
  BookingStatus.ACEITA,
  BookingStatus.RECUSADA,
  BookingStatus.CANCELADA,
] as const;

/** Quantas alterações a listagem devolve, das mais recentes (HU48). */
export const NOTIFICATIONS_LIMIT = 50;

export class BookingNotificationResponse {
  @ApiProperty({
    description:
      'Identificador da alteração. Inclui a situação do sinal e da devolução: cada mudança do pagamento por Pix gera um id novo (notificação não lida).',
  })
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

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description:
      'Situação do sinal valendo agora (o prazo vencido aparece como expirado); ausente sem pagamento',
  })
  pagamento?: PaymentStatus;

  @ApiPropertyOptional({
    enum: ['pendente', 'feita', 'retido'],
    description: 'Depois de um cancelamento com sinal pago',
  })
  devolucao?: 'pendente' | 'feita' | 'retido';
}
