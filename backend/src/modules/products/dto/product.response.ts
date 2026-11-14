import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../domain/product.js';

/** Responsável pela oferta (CA08, RN09): só dados de divulgação. */
export class ProductProducerResponse {
  @ApiProperty({ example: '64b0c0ffee0000000000abcd' })
  id: string;

  @ApiProperty({ example: 'Horta da Joana' })
  nomeIniciativa: string;
}

/** Produto como apresentado ao produtor e ao público (HU15). */
export class ProductResponse {
  @ApiProperty({ example: '64b0c0ffee0000000000beef' })
  id: string;

  @ApiProperty({ example: 'Cesta de hortaliças da estação' })
  nome: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.PRODUTOS })
  categoria: ProductCategory;

  @ApiProperty({
    example: 'Cesta com hortaliças frescas cultivadas sem agrotóxicos.',
  })
  descricao: string;

  @ApiProperty({ example: 40, description: 'Reais, até 2 casas decimais' })
  precoPorUnidade: number;

  @ApiProperty({ example: 500 })
  gramasPorUnidade: number;

  @ApiProperty({
    type: [String],
    example: [
      '/products/64b0c0ffee0000000000beef/photos/64b0c0ffee0000000000f001?v=Q2FmdXJpbmdhRm90',
    ],
    description:
      'Caminhos das fotos, na ordem enviada, relativos à URL base da API. Mudam a cada foto nova, então podem ficar em cache indefinidamente.',
  })
  fotos: string[];

  @ApiProperty({ type: ProductProducerResponse })
  produtor: ProductProducerResponse;

  @ApiProperty({
    example: '2026-11-13T12:00:00.000Z',
    description: 'Data do cadastro',
  })
  criadoEm: string;

  @ApiProperty({
    example: true,
    description:
      'Se a oferta está disponível (RN10). As rotas públicas só devolvem disponíveis; o campo existe para a gestão de disponibilidade (RF18).',
  })
  disponivel: boolean;
}
