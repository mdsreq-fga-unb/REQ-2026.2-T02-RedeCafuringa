import { ApiProperty } from '@nestjs/swagger';
import { ExperienceResponse } from '../../experiences/dto/experience.response.js';
import { PublicTrajectoryResponse } from '../../producer-profile/dto/trajectory.response.js';
import { ProductResponse } from '../../products/dto/product.response.js';

export class SearchProducersResult {
  @ApiProperty({
    type: [PublicTrajectoryResponse],
    description:
      'Produtores com perfil publicado que combinam com o termo (iniciativa, trajetória ou atividades), até o limite pedido',
  })
  itens: PublicTrajectoryResponse[];

  @ApiProperty({
    example: 3,
    description: 'Total de produtores que combinam, mesmo além do limite',
  })
  total: number;
}

export class SearchProductsResult {
  @ApiProperty({
    type: [ProductResponse],
    description:
      'Produtos disponíveis que combinam com o termo (nome ou iniciativa), do mais novo ao mais antigo',
  })
  itens: ProductResponse[];

  @ApiProperty({
    example: 8,
    description: 'Total de produtos que combinam, mesmo além do limite',
  })
  total: number;
}

export class SearchExperiencesResult {
  @ApiProperty({
    type: [ExperienceResponse],
    description:
      'Experiências disponíveis que combinam com o termo (nome ou iniciativa), da mais nova à mais antiga',
  })
  itens: ExperienceResponse[];

  @ApiProperty({
    example: 2,
    description: 'Total de experiências que combinam, mesmo além do limite',
  })
  total: number;
}

/** Resultado da busca de ofertas, agrupado por tipo (HU36, CA03 e CA04). */
export class SearchResponse {
  @ApiProperty({
    example: 'cafe',
    description: 'Termo pesquisado, sem espaços sobrando',
  })
  termo: string;

  @ApiProperty({ type: SearchProducersResult })
  produtores: SearchProducersResult;

  @ApiProperty({ type: SearchProductsResult })
  produtos: SearchProductsResult;

  @ApiProperty({ type: SearchExperiencesResult })
  experiencias: SearchExperiencesResult;
}
