import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  DEFAULT_PRODUCTS_PAGE,
  MAX_PRODUCTS_PAGE,
} from '../../products/dto/list-products.query.js';

/**
 * Busca de ofertas (HU36). O termo é validado por `parseSearchTerm`, que
 * devolve a orientação de correção (CA08); aqui só se garante que é um texto.
 */
export class SearchQuery {
  @ApiPropertyOptional({
    example: 'cafe',
    description:
      'Termo da busca: de 2 a 100 caracteres, com ao menos uma letra ou número. Procura sem diferenciar acentos e maiúsculas. Obrigatório: sem ele a resposta é 400 com a orientação de correção.',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser um texto' })
  busca?: string;

  @ApiPropertyOptional({
    example: DEFAULT_PRODUCTS_PAGE,
    default: DEFAULT_PRODUCTS_PAGE,
    minimum: 1,
    maximum: MAX_PRODUCTS_PAGE,
    description: 'Quantidade máxima de resultados em cada tipo de oferta',
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
