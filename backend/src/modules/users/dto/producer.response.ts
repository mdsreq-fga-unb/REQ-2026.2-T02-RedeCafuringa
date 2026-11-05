import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProducerCategory } from '../domain/producer-category.js';
import { Role } from '../domain/role.js';

/** Retorno do produtor titular. CPF mascarado; CNPJ nunca é devolvido (RN07). */
export class ProducerResponse {
  @ApiProperty({
    example: '665f1c2e9b1d4a0012ab34cd',
    description: 'Identificador do usuário',
  })
  id: string;

  @ApiProperty({
    example: 'Maria das Graças',
    description: 'Nome do responsável',
  })
  nome: string;

  @ApiProperty({
    example: 'Sítio Boa Vista',
    description: 'Nome da iniciativa ou propriedade',
  })
  nomeIniciativa?: string;

  @ApiProperty({
    example: 'Maria das Graças',
    description: 'Responsável pela iniciativa (RN09)',
  })
  nomeResponsavel?: string;

  @ApiProperty({ example: 'maria@exemplo.com', description: 'E-mail da conta' })
  email: string;

  @ApiProperty({ example: 'Cafuringa', description: 'Localidade' })
  localidade?: string;

  @ApiPropertyOptional({
    example: '61999990000',
    description: 'DDD + número; ausente se não informado',
  })
  telefone?: string;

  @ApiProperty({
    enum: ProducerCategory,
    description: 'Categoria ofertada',
  })
  categoriaOfertada?: ProducerCategory;

  @ApiProperty({
    type: [String],
    example: ['PIX'],
    description: 'Formas de pagamento aceitas',
  })
  formasPagamento?: string[];

  @ApiProperty({ enum: Role, description: 'Perfil de acesso (RN01)' })
  perfil: Role;

  @ApiPropertyOptional({
    example: '***.982.247-**',
    description: 'CPF mascarado',
  })
  cpf?: string;
}
