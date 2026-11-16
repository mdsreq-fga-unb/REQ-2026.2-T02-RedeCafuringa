import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateBy,
  type ValidationArguments,
} from 'class-validator';
import { normalizeFreeText } from '../../producer-profile/domain/trajectory.js';
import {
  type AmountProblem,
  checkAmount,
  DESCRICAO_MAX,
  GRAMAS_MAX,
  NOME_MAX,
  parseDecimal,
  PRECO_MAX,
  ProductCategory,
} from '../domain/product.js';

const normalize = ({ value }: { value: unknown }) => normalizeFreeText(value);
const decimal = ({ value }: { value: unknown }) => parseDecimal(value);

/** Valor decimal (até 2 casas) dentro da faixa, com uma única mensagem por problema. */
function IsAmount(
  range: { min: number; max: number; exclusiveMin?: boolean },
  messages: Record<AmountProblem, string>,
) {
  return ValidateBy({
    name: 'isAmount',
    validator: {
      validate: (value: unknown) => checkAmount(value, range) === null,
      defaultMessage: (args?: ValidationArguments) =>
        messages[checkAmount(args?.value, range) ?? 'invalido'],
    },
  });
}

/**
 * HU15 (CA02, CA04, RN11): dados mínimos para apresentar a oferta. Chega como
 * multipart/form-data, então números vêm como texto e são convertidos aqui.
 * O produtor dono não faz parte do corpo: vem do token (RN09).
 */
export class CreateProductDto {
  @ApiProperty({
    example: 'Cesta de hortaliças da estação',
    maxLength: NOME_MAX,
    description: `Texto simples, até ${NOME_MAX} caracteres`,
  })
  @Transform(normalize)
  @IsString({ message: 'Nome deve ser um texto' })
  @IsNotEmpty({ message: 'Informe o nome do produto' })
  @MaxLength(NOME_MAX, {
    message: `Nome deve ter no máximo ${NOME_MAX} caracteres`,
  })
  nome: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.PRODUTOS })
  @IsEnum(ProductCategory, {
    message: `Categoria deve ser ${Object.values(ProductCategory).join(' ou ')}`,
  })
  categoria: ProductCategory;

  @ApiProperty({
    example:
      'Cesta com hortaliças frescas cultivadas sem agrotóxicos no Núcleo Rural.',
    maxLength: DESCRICAO_MAX,
    description: `Texto simples, até ${DESCRICAO_MAX} caracteres`,
  })
  @Transform(normalize)
  @IsString({ message: 'Descrição deve ser um texto' })
  @IsNotEmpty({ message: 'Informe a descrição do produto' })
  @MaxLength(DESCRICAO_MAX, {
    message: `Descrição deve ter no máximo ${DESCRICAO_MAX} caracteres`,
  })
  descricao: string;

  @ApiProperty({
    example: 40,
    minimum: 0,
    maximum: PRECO_MAX,
    description:
      'Preço por unidade em reais, com ponto e até 2 casas decimais. Zero é aceito (oferta gratuita).',
  })
  @Transform(decimal)
  @IsAmount(
    { min: 0, max: PRECO_MAX },
    {
      invalido:
        'Informe um preço válido, com ponto e até 2 casas decimais (ex.: 40.50)',
      abaixo: 'Preço deve ser maior ou igual a zero',
      acima: `Preço deve ser no máximo ${PRECO_MAX}`,
    },
  )
  precoPorUnidade: number;

  @ApiProperty({
    example: 500,
    exclusiveMinimum: true,
    minimum: 0,
    maximum: GRAMAS_MAX,
    description:
      'Peso de uma unidade em gramas, maior que zero, até 2 casas decimais',
  })
  @Transform(decimal)
  @IsAmount(
    { min: 0, max: GRAMAS_MAX, exclusiveMin: true },
    {
      invalido:
        'Informe as gramas por unidade, com ponto e até 2 casas decimais',
      abaixo: 'Gramas por unidade deve ser maior que zero',
      acima: `Gramas por unidade deve ser no máximo ${GRAMAS_MAX}`,
    },
  )
  gramasPorUnidade: number;
}
