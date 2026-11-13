import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../domain/product.js';

/** Tamanho máximo de página: respostas enxutas em conexão instável (RNF06). */
export const MAX_PRODUCTS_PAGE = 50;
export const DEFAULT_PRODUCTS_PAGE = 20;

/** Catálogo público de produtos (consumido pela HU19): filtros e paginação. */
export class ListProductsQuery {
  @ApiPropertyOptional({
    example: '64b0c0ffee0000000000abcd',
    description: 'Só os produtos deste produtor (catálogo do perfil)',
  })
  @IsOptional()
  @IsMongoId({ message: 'Produtor inválido' })
  produtor?: string;

  @ApiPropertyOptional({ enum: ProductCategory })
  @IsOptional()
  @IsEnum(ProductCategory, {
    message: `Categoria deve ser ${Object.values(ProductCategory).join(' ou ')}`,
  })
  categoria?: ProductCategory;

  @ApiPropertyOptional({
    example: 'cafe',
    description:
      'Trecho do nome do produto ou do nome da iniciativa do produtor, sem diferenciar acentos e maiúsculas (HU19, RN15)',
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
    example: DEFAULT_PRODUCTS_PAGE,
    default: DEFAULT_PRODUCTS_PAGE,
    minimum: 1,
    maximum: MAX_PRODUCTS_PAGE,
    description: 'Quantidade de produtos por página',
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
