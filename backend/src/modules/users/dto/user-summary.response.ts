import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../domain/role.js';

/** Item da consulta administrativa (HU04): identifica a conta e o perfil, sem dados privados. */
export class UserSummaryResponse {
  @ApiProperty({
    example: '665f1c2e9b1d4a0012ab34cd',
    description: 'Identificador do usuário',
  })
  id: string;

  @ApiProperty({
    example: 'Maria das Graças',
    description: 'Nome completo (no produtor, o responsável)',
  })
  nome: string;

  @ApiProperty({ example: 'maria@exemplo.com', description: 'E-mail da conta' })
  email: string;

  @ApiProperty({ enum: Role, description: 'Perfil de acesso (RN01, CA05)' })
  perfil: Role;

  @ApiPropertyOptional({
    example: 'Sítio Boa Vista',
    description: 'Nome da iniciativa; só em produtores',
  })
  nomeIniciativa?: string;
}
