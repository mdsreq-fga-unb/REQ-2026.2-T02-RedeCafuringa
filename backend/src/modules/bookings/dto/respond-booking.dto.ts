import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { normalizeFreeText } from '../../producer-profile/domain/trajectory.js';
import { MENSAGEM_MAX, BookingStatus } from '../domain/booking.js';

export type BookingDecision = BookingStatus.ACEITA | BookingStatus.RECUSADA;

export class RespondBookingDto {
  @ApiProperty({
    enum: [BookingStatus.ACEITA, BookingStatus.RECUSADA],
    description: 'Decisão do produtor sobre a pré-reserva',
  })
  @IsIn([BookingStatus.ACEITA, BookingStatus.RECUSADA], {
    message: 'Escolha uma resposta válida',
  })
  status: BookingDecision;

  @ApiPropertyOptional({
    example: 'Podemos receber vocês às 9h.',
    maxLength: MENSAGEM_MAX,
    description: 'Mensagem do produtor ao responder a solicitação',
  })
  @Transform(({ value }) => normalizeFreeText(value))
  @IsOptional()
  @IsString({ message: 'Mensagem deve ser um texto' })
  @MaxLength(MENSAGEM_MAX, {
    message: `Mensagem deve ter no máximo ${MENSAGEM_MAX} caracteres`,
  })
  mensagemResposta?: string;
}
