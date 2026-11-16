import { ApiProperty } from '@nestjs/swagger';
import { ProductResponse } from './product.response.js';

/** Página do catálogo público de produtos (mesmo formato de paginação da HU04). */
export class ProductListResponse {
  @ApiProperty({
    type: [ProductResponse],
    description:
      'Produtos da página, do mais novo ao mais antigo; vazio quando não há registros. Cada item tem o mesmo formato de `GET /products/{id}`.',
  })
  itens: ProductResponse[];

  @ApiProperty({
    example: 42,
    description: 'Total de produtos que atendem aos filtros',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Página devolvida' })
  pagina: number;

  @ApiProperty({ example: 20, description: 'Tamanho da página' })
  limite: number;
}
