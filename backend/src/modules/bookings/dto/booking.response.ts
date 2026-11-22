import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, PaymentMethod } from '../domain/booking.js';

/**
 * Pré-reserva como apresentada ao solicitante (HU44, CA06). Não traz dados do
 * consumidor nem do produtor (RNF11): quem pediu já sabe quem é.
 */
export class BookingResponse {
  @ApiProperty({ example: '64b0c0ffee0000000000b001' })
  id: string;

  @ApiProperty({
    example: '64b0c0ffee0000000000e001',
    description: 'Experiência solicitada',
  })
  experienciaId: string;

  @ApiProperty({ example: '2026-12-10', format: 'date' })
  data: string;

  @ApiProperty({ example: '09:00' })
  horario: string;

  @ApiProperty({ example: 4 })
  participantes: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX })
  formaPagamento: PaymentMethod;

  @ApiPropertyOptional({
    example: 'Vamos com duas crianças.',
    description: 'Ausente quando o solicitante não deixou recado',
  })
  mensagem?: string;

  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.PENDENTE,
    description:
      'Situação da solicitação. Nasce pendente, aguardando a resposta do produtor (RN19, CA06).',
  })
  status: BookingStatus;

  @ApiProperty({
    example: '2026-11-21T12:00:00.000Z',
    description: 'Data do envio',
  })
  criadoEm: string;
}
