import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../domain/role.js';

/** Conta administrativa criada: sem senha, hash nem dados pessoais. */
export class AdminResponse {
  @ApiProperty({
    example: '665f1c2e9b1d4a0012ab34cd',
    description: 'Identificador do usuário',
  })
  id: string;

  @ApiProperty({ example: 'admin@exemplo.com', description: 'E-mail da conta' })
  email: string;

  @ApiProperty({
    enum: Role,
    example: Role.ADMINISTRADOR,
    description: 'Perfil de acesso (RN01)',
  })
  perfil: Role;
}
