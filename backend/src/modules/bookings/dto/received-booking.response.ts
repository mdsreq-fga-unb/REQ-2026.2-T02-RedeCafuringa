import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingResponse } from './booking.response.js';

/** Pré-reserva recebida e visível somente ao produtor responsável (HU47). */
export class ReceivedBookingResponse extends BookingResponse {
  @ApiProperty({
    example: 'CAF-4A12BC',
    description: 'Código curto para identificar a solicitação',
  })
  codigo: string;

  @ApiProperty({ example: 'Visita e Degustação de Queijos' })
  experienciaNome: string;

  @ApiProperty({ example: 'Ana Oliveira' })
  consumidorNome: string;

  @ApiProperty({
    example: 182,
    description: 'Valor total em reais, calculado a partir da oferta e pessoas',
  })
  valorTotal: number;

  @ApiPropertyOptional({
    example: 'Podemos receber vocês às 9h.',
    description: 'Mensagem enviada pelo produtor ao responder',
  })
  mensagemResposta?: string;
}
