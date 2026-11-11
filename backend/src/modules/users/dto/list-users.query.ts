import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Role } from '../domain/role.js';

/** Tamanho máximo de página: respostas enxutas em conexão instável (RNF06). */
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;

/** HU04: filtros e paginação da consulta administrativa de usuários. */
export class ListUsersQuery {
  @ApiPropertyOptional({
    enum: Role,
    description: 'Restringe a consulta a um perfil (CA02, CA03, CA04)',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Perfil inválido' })
  perfil?: Role;

  @ApiPropertyOptional({
    example: 'Maria',
    description: 'Trecho do nome, e-mail ou nome da iniciativa',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser um texto' })
  @MaxLength(100, { message: 'Busca deve ter no máximo 100 caracteres' })
  busca?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Página desejada, a partir de 1',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  pagina?: number;

  @ApiPropertyOptional({
    example: DEFAULT_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    description: 'Quantidade de usuários por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  @Max(MAX_PAGE_SIZE, {
    message: `Limite deve ser no máximo ${MAX_PAGE_SIZE}`,
  })
  limite?: number;
}
