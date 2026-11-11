import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../domain/role.js';

/** Perfil exposto ao próprio titular: nada de hash, cifra ou CPF completo. */
export class UserResponse {
  @ApiProperty({
    example: '665f1c2e9b1d4a0012ab34cd',
    description: 'Identificador do usuário',
  })
  id: string;

  @ApiProperty({ example: 'Maria das Graças', description: 'Nome completo' })
  nome: string;

  @ApiProperty({ example: 'maria@exemplo.com', description: 'E-mail da conta' })
  email: string;

  @ApiPropertyOptional({
    example: '61999990000',
    description: 'DDD + número; ausente se não informado',
  })
  telefone?: string;

  @ApiProperty({ enum: Role, description: 'Perfil de acesso (RN01)' })
  perfil: Role;

  @ApiPropertyOptional({
    example: '***.982.247-**',
    description: 'CPF mascarado; ausente em contas administrativas',
  })
  cpf?: string;
}
