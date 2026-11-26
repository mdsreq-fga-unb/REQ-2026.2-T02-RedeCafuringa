import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateBy,
} from 'class-validator';
import {
  normalizePixKey,
  PIX_KEY_TYPES,
  type PixKeyType,
} from '../../../common/pix/pix-key.js';
import { normalizeFreeText } from '../domain/trajectory.js';

export const PIX_RECEBEDOR_MAX = 60;
const RECEBEDOR_OBRIGATORIO =
  'Informe o nome de quem recebe o Pix, como aparece no banco';

/**
 * A chave precisa combinar com o tipo escolhido. Com tipo inválido, só o tipo
 * é apontado, para a produtora receber uma orientação só (RNF03).
 */
function IsPixKeyForType(): PropertyDecorator {
  return ValidateBy({
    name: 'isPixKeyForType',
    validator: {
      validate: (value: unknown, args) => {
        const tipo = (args?.object as { tipo?: unknown }).tipo;
        if (!PIX_KEY_TYPES.includes(tipo as PixKeyType)) return true;
        return normalizePixKey(tipo as PixKeyType, value) !== null;
      },
      defaultMessage: () => 'Chave Pix inválida para o tipo escolhido',
    },
  });
}

/** Pagamento por Pix: chave da produtora para receber o sinal das pré-reservas. */
export class SavePixDto {
  @ApiProperty({ enum: PIX_KEY_TYPES, example: 'telefone' })
  @IsIn(PIX_KEY_TYPES, {
    message: `Tipo da chave Pix deve ser ${PIX_KEY_TYPES.slice(0, -1).join(', ')} ou ${PIX_KEY_TYPES.at(-1)}`,
  })
  tipo: PixKeyType;

  @ApiProperty({
    example: '(61) 99999-8888',
    description:
      'A chave como a produtora digitou; a API guarda normalizada (só dígitos, +55 no telefone, e-mail em minúsculas).',
  })
  @IsPixKeyForType()
  chave: string;

  @ApiProperty({
    example: 'Maria da Silva',
    maxLength: PIX_RECEBEDOR_MAX,
    description:
      'Nome de quem recebe, como aparece no banco. A consumidora confere antes de pagar.',
  })
  @Transform(({ value }: { value: unknown }) => normalizeFreeText(value))
  @IsString({ message: RECEBEDOR_OBRIGATORIO })
  @IsNotEmpty({ message: RECEBEDOR_OBRIGATORIO })
  @MaxLength(PIX_RECEBEDOR_MAX, {
    message: `Nome do recebedor deve ter no máximo ${PIX_RECEBEDOR_MAX} caracteres`,
  })
  nomeRecebedor: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Se verdadeiro, a consumidora com pré-reserva aceita vê a chave para pagar. Por padrão, privado.',
  })
  @IsOptional()
  @IsBoolean({ message: 'pix.publico deve ser verdadeiro ou falso' })
  publico?: boolean;
}
