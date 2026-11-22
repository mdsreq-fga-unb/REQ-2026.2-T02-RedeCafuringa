import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateBy,
} from 'class-validator';
import { normalizeFreeText } from '../../producer-profile/domain/trajectory.js';
import {
  BOOKING_HOURS,
  isValidBookingDate,
  MENSAGEM_MAX,
  PARTICIPANTES_MAX,
  PARTICIPANTES_MIN,
  PaymentMethod,
} from '../domain/booking.js';

// Mensagem só de espaços ou caracteres invisíveis equivale a não enviar.
const mensagem = ({ value }: { value: unknown }) => {
  const text = normalizeFreeText(value);
  return text === '' ? undefined : text;
};

const PARTICIPANTES_MESSAGE = `Informe de ${PARTICIPANTES_MIN} a ${PARTICIPANTES_MAX} participantes`;

function IsBookingDate() {
  return ValidateBy({
    name: 'isBookingDate',
    validator: {
      validate: (value: unknown) => isValidBookingDate(value),
      defaultMessage: () => 'Informe uma data válida (AAAA-MM-DD)',
    },
  });
}

/**
 * HU44 (CA03, CA04): dados da solicitação de pré-reserva. O consumidor vem do
 * token e o status nasce pendente (RN19); nenhum dos dois faz parte do corpo.
 * Data e horário no passado são recusados pelo service, que conhece o relógio.
 */
export class CreateBookingDto {
  @ApiProperty({
    example: '64b0c0ffee0000000000e001',
    description: 'Identificador da experiência desejada (RN19)',
  })
  @IsNotEmpty({ message: 'Informe a experiência' })
  @IsMongoId({ message: 'Experiência inválida' })
  experienciaId: string;

  @ApiProperty({
    example: '2026-12-10',
    format: 'date',
    description:
      'Dia desejado (AAAA-MM-DD), no horário de Brasília. Não pode estar no passado.',
  })
  @IsNotEmpty({ message: 'Informe a data desejada' })
  @IsBookingDate()
  data: string;

  @ApiProperty({
    example: '09:00',
    enum: BOOKING_HOURS,
    description:
      'Horário de início, de hora em hora (00:00 a 23:00). Não pode ter começado.',
  })
  @IsNotEmpty({ message: 'Escolha o horário' })
  @IsIn(BOOKING_HOURS, { message: 'Escolha um horário da lista' })
  horario: string;

  @ApiProperty({
    example: 4,
    minimum: PARTICIPANTES_MIN,
    maximum: PARTICIPANTES_MAX,
    description: 'Quantidade de pessoas, número inteiro',
  })
  @IsInt({ message: PARTICIPANTES_MESSAGE })
  @Min(PARTICIPANTES_MIN, { message: PARTICIPANTES_MESSAGE })
  @Max(PARTICIPANTES_MAX, { message: PARTICIPANTES_MESSAGE })
  participantes: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
    description:
      'Forma de pagamento a combinar com o produtor; a plataforma não cobra (OE3)',
  })
  @IsNotEmpty({ message: 'Escolha a forma de pagamento' })
  @IsEnum(PaymentMethod, {
    message: 'Escolha uma forma de pagamento da lista',
  })
  formaPagamento: PaymentMethod;

  @ApiPropertyOptional({
    example: 'Vamos com duas crianças.',
    maxLength: MENSAGEM_MAX,
    description: `Recado ao produtor. Texto simples, até ${MENSAGEM_MAX} caracteres`,
  })
  @Transform(mensagem)
  @IsOptional()
  @IsString({ message: 'Mensagem deve ser um texto' })
  @MaxLength(MENSAGEM_MAX, {
    message: `Mensagem deve ter no máximo ${MENSAGEM_MAX} caracteres`,
  })
  mensagem?: string;
}
