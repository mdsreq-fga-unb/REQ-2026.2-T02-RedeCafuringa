import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LOGIN_PROFILES, type LoginProfile } from '../../users/domain/role.js';

/** RN05: a autenticação usa e-mail e senha; CPF/CNPJ não são credenciais. */
export class LoginDto {
  @ApiProperty({
    example: 'maria@exemplo.com',
    description: 'E-mail cadastrado (sem distinção de maiúsculas)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(254, { message: 'E-mail deve ter no máximo 254 caracteres' })
  email: string;

  @ApiProperty({ example: 'SenhaForte123' })
  @IsString({ message: 'Senha deve ser um texto' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  senha: string;

  @ApiPropertyOptional({
    enum: LOGIN_PROFILES,
    example: 'CONSUMIDOR',
    description:
      'Perfil da tela de login. A mesma pessoa pode ter conta de consumidor e de produtor com o mesmo e-mail; o administrador entra por qualquer uma.',
  })
  @IsOptional()
  @IsIn(LOGIN_PROFILES, { message: 'Perfil deve ser CONSUMIDOR ou PRODUTOR' })
  perfil?: LoginProfile;
}
