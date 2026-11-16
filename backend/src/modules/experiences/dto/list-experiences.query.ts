import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import {
  DEFAULT_PRODUCTS_PAGE,
  MAX_PRODUCTS_PAGE,
} from '../../products/dto/list-products.query.js';

/** Catálogo público de experiências: filtro por produtor e paginação. */
export class ListExperiencesQuery {
  @ApiPropertyOptional({
    example: '64b0c0ffee0000000000abcd',
    description: 'Só as experiências deste produtor (catálogo do perfil)',
  })
  @IsOptional()
  @IsMongoId({ message: 'Produtor inválido' })
  produtor?: string;

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
    example: DEFAULT_PRODUCTS_PAGE,
    default: DEFAULT_PRODUCTS_PAGE,
    minimum: 1,
    maximum: MAX_PRODUCTS_PAGE,
    description: 'Quantidade de experiências por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  @Max(MAX_PRODUCTS_PAGE, {
    message: `Limite deve ser no máximo ${MAX_PRODUCTS_PAGE}`,
  })
  limite?: number;
}
