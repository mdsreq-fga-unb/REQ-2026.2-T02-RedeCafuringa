import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProducerCategory } from '../domain/producer-category.js';
import { Role } from '../domain/role.js';

/**
 * Detalhe de um usuário para o administrador (HU04). Documentos só mascarados
 * e nenhuma senha ou hash (CA06, RNF11).
 */
export class UserDetailResponse {
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
    example: '61999990000',
    description: 'DDD + número; ausente se não informado',
  })
  telefone?: string;

  @ApiPropertyOptional({
    example: '***.982.247-**',
    description: 'CPF mascarado; ausente em contas administrativas',
  })
  cpf?: string;

  @ApiPropertyOptional({
    example: '**.222.333/0001-**',
    description: 'CNPJ mascarado; só em produtores que o informaram',
  })
  cnpj?: string;

  @ApiPropertyOptional({
    example: 'Sítio Boa Vista',
    description: 'Nome da iniciativa; só em produtores',
  })
  nomeIniciativa?: string;

  @ApiPropertyOptional({
    example: 'Maria das Graças',
    description: 'Responsável pela iniciativa; só em produtores',
  })
  nomeResponsavel?: string;

  @ApiPropertyOptional({
    example: 'Cafuringa, Brasília/DF',
    description: 'Localidade; só em produtores',
  })
  localidade?: string;

  @ApiPropertyOptional({
    enum: ProducerCategory,
    description: 'Categoria ofertada; só em produtores',
  })
  categoriaOfertada?: ProducerCategory;

  @ApiPropertyOptional({
    type: [String],
    example: ['PIX', 'Dinheiro'],
    description: 'Formas de pagamento aceitas; só em produtores',
  })
  formasPagamento?: string[];
}
