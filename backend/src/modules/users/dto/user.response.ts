import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../domain/role.js';

/** Perfil exposto ao próprio titular: nada de hash, cifra ou CPF completo. */
export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  telefone: string;

  @ApiProperty({ enum: Role })
  perfil: Role;

  @ApiProperty({ example: '***.982.247-**', description: 'CPF mascarado' })
  cpf: string;
}
