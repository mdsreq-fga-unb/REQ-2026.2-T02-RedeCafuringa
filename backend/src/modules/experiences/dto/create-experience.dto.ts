import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateBy,
  type ValidationArguments,
} from 'class-validator';
import {
  IsYoutubeUrl,
  NormalizeVideoUrl,
} from '../../../common/video/is-youtube-url.decorator.js';
import { VIDEO_URL_MAX } from '../../../common/video/youtube.js';
import { normalizeFreeText } from '../../producer-profile/domain/trajectory.js';
import {
  type AmountProblem,
  checkAmount,
  parseDecimal,
} from '../../products/domain/product.js';
import {
  DESCRICAO_MAX,
  DURACAO_QTD_MAX,
  ExperienceCategory,
  LOCAL_MAX,
  NOME_MAX,
  normalizeDuracao,
  VALOR_MAX,
} from '../domain/experience.js';

const normalize = ({ value }: { value: unknown }) => normalizeFreeText(value);
const decimal = ({ value }: { value: unknown }) => parseDecimal(value);
// Duração inválida segue como veio, para o validador apontar o problema.
const duracao = ({ value }: { value: unknown }) =>
  normalizeDuracao(value) ?? value;

const VALOR_MESSAGES: Record<AmountProblem, string> = {
  invalido:
    'Informe um valor por pessoa válido, com ponto e até 2 casas decimais (ex.: 45.50)',
  abaixo: 'Valor por pessoa deve ser maior ou igual a zero',
  acima: `Valor por pessoa deve ser no máximo ${VALOR_MAX}`,
};

/** Valor decimal (até 2 casas) entre 0 e o teto, com uma única mensagem por problema. */
function IsValorPorPessoa() {
  const range = { min: 0, max: VALOR_MAX };
  return ValidateBy({
    name: 'isValorPorPessoa',
    validator: {
      validate: (value: unknown) => checkAmount(value, range) === null,
      defaultMessage: (args?: ValidationArguments) =>
        VALOR_MESSAGES[checkAmount(args?.value, range) ?? 'invalido'],
    },
  });
}

function IsDuracao() {
  return ValidateBy({
    name: 'isDuracao',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && normalizeDuracao(value) === value,
      defaultMessage: () =>
        `Informe a duração com um número inteiro de 1 a ${DURACAO_QTD_MAX} seguido de minutos ou horas (ex.: 2 horas)`,
    },
  });
}

/**
 * HU21 (CA02, CA04, RN11): dados mínimos para apresentar a experiência. Chega
 * como multipart/form-data, então números vêm como texto e são convertidos
 * aqui. O produtor dono não faz parte do corpo: vem do token (RN09, CA03).
 */
export class CreateExperienceDto {
  @ApiProperty({
    example: 'Trilha guiada da nascente',
    maxLength: NOME_MAX,
    description: `Título da experiência. Texto simples, até ${NOME_MAX} caracteres`,
  })
  @Transform(normalize)
  @IsString({ message: 'Título deve ser um texto' })
  @IsNotEmpty({ message: 'Informe o título da experiência' })
  @MaxLength(NOME_MAX, {
    message: `Título deve ter no máximo ${NOME_MAX} caracteres`,
  })
  nome: string;

  @ApiProperty({
    enum: ExperienceCategory,
    example: ExperienceCategory.EXPERIENCIA,
  })
  @IsEnum(ExperienceCategory, {
    message: `Categoria deve ser ${Object.values(ExperienceCategory).join(' ou ')}`,
  })
  categoria: ExperienceCategory;

  @ApiProperty({
    example: 'Caminhada de 3 km até a nascente, com parada para café da roça.',
    maxLength: DESCRICAO_MAX,
    description: `Texto simples, até ${DESCRICAO_MAX} caracteres`,
  })
  @Transform(normalize)
  @IsString({ message: 'Descrição deve ser um texto' })
  @IsNotEmpty({ message: 'Informe a descrição da experiência' })
  @MaxLength(DESCRICAO_MAX, {
    message: `Descrição deve ter no máximo ${DESCRICAO_MAX} caracteres`,
  })
  descricao: string;

  @ApiProperty({
    example: 45,
    minimum: 0,
    maximum: VALOR_MAX,
    description:
      'Valor por pessoa em reais, com ponto e até 2 casas decimais. Zero é aceito (experiência gratuita).',
  })
  @Transform(decimal)
  @IsValorPorPessoa()
  valorPorPessoa: number;

  @ApiProperty({
    example: 'Sítio Boa Vista, Núcleo Rural Cafuringa',
    maxLength: LOCAL_MAX,
    description: `Onde a experiência acontece. Texto simples, até ${LOCAL_MAX} caracteres`,
  })
  @Transform(normalize)
  @IsString({ message: 'Local deve ser um texto' })
  @IsNotEmpty({ message: 'Informe o local da experiência' })
  @MaxLength(LOCAL_MAX, {
    message: `Local deve ter no máximo ${LOCAL_MAX} caracteres`,
  })
  local: string;

  @ApiProperty({
    example: '2 horas',
    description: `Número inteiro de 1 a ${DURACAO_QTD_MAX} seguido de "minutos" ou "horas" (singular aceito para 1)`,
  })
  @Transform(duracao)
  @IsDuracao()
  duracao: string;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    maxLength: VIDEO_URL_MAX,
    description:
      'Link de um vídeo do YouTube (watch, youtu.be, shorts ou embed). A API guarda só o id do vídeo e devolve `videoId`. Em branco equivale a sem vídeo.',
  })
  @NormalizeVideoUrl()
  @IsOptional()
  @IsYoutubeUrl()
  videoUrl?: string;
}
