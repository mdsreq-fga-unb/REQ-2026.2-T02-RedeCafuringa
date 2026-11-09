import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  ACTIVITIES_MAX,
  normalizeFreeText,
  TRAJECTORY_MAX,
} from '../domain/trajectory.js';

const normalize = ({ value }: { value: unknown }) => normalizeFreeText(value);

/** HU12: dados que o produtor registra sobre sua história e atuação. */
export class SaveTrajectoryDto {
  @ApiProperty({
    example:
      'Começamos a plantar café em 1990, no Núcleo Rural de Planaltina. Hoje a família toda participa da produção.',
    description: `Sua história, em texto simples (sem HTML), até ${TRAJECTORY_MAX} caracteres`,
    maxLength: TRAJECTORY_MAX,
  })
  @Transform(normalize)
  @IsString({ message: 'Trajetória deve ser um texto' })
  @IsNotEmpty({ message: 'Trajetória é obrigatória' })
  @MaxLength(TRAJECTORY_MAX, {
    message: `Trajetória deve ter no máximo ${TRAJECTORY_MAX} caracteres`,
  })
  trajetoria: string;

  @ApiPropertyOptional({
    example: 'Horta orgânica, visitas guiadas e café da manhã rural.',
    description: `Atividades que você desenvolve, em texto simples, até ${ACTIVITIES_MAX} caracteres. Se omitido, o valor anterior é apagado.`,
    maxLength: ACTIVITIES_MAX,
  })
  @Transform(normalize)
  @IsOptional()
  @IsString({ message: 'Atividades deve ser um texto' })
  @MaxLength(ACTIVITIES_MAX, {
    message: `Atividades deve ter no máximo ${ACTIVITIES_MAX} caracteres`,
  })
  atividades?: string;

  @ApiPropertyOptional({
    example: '61999990000',
    nullable: true,
    description:
      'DDD + número, apenas dígitos. Se omitido, o telefone cadastrado não muda. Com `null`, o telefone é removido (e deixa de ser público).',
  })
  // Formulário que envia o campo em branco equivale a não informar. `null` é o
  // único jeito de apagar o telefone, e é explícito; qualquer outro tipo é
  // validado e recusado, para não apagar o cadastro por um caminho fora do contrato.
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString({
    message: 'Telefone deve ter DDD e número, apenas dígitos (10 ou 11)',
  })
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve ter DDD e número, apenas dígitos (10 ou 11)',
  })
  telefone?: string | null;

  @ApiPropertyOptional({
    example: true,
    description:
      'Se verdadeiro, o telefone aparece no perfil público (RN07). Se omitido, a escolha anterior não muda; por padrão o telefone é privado.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean({ message: 'telefonePublico deve ser verdadeiro ou falso' })
  telefonePublico?: boolean;
}
