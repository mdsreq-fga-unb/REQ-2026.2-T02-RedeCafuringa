import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { StrongPassword } from '../../../common/validators/strong-password.decorator.js';

/** HU03/RF03: a conta administrativa só precisa de e-mail e senha. */
export class CreateAdminDto {
  @ApiProperty({
    example: 'admin@exemplo.com',
    description: 'E-mail de acesso do novo administrador',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(254, { message: 'E-mail deve ter no máximo 254 caracteres' })
  email: string;

  @StrongPassword()
  senha: string;
}
