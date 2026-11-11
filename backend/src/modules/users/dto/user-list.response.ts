import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryResponse } from './user-summary.response.js';

/** Página da consulta administrativa de usuários (HU04). */
export class UserListResponse {
  @ApiProperty({
    type: [UserSummaryResponse],
    description:
      'Usuários da página, em ordem alfabética; vazio quando não há registros (CA08)',
  })
  itens: UserSummaryResponse[];

  @ApiProperty({
    example: 42,
    description: 'Total de usuários que atendem aos filtros',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Página devolvida' })
  pagina: number;

  @ApiProperty({ example: 20, description: 'Tamanho da página' })
  limite: number;
}
