import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  IsCpf,
  NormalizeDocument,
} from '../../../common/validators/is-cpf.decorator.js';

/** RN08: a autenticação usa CPF e senha. */
export class LoginDto {
  @ApiProperty({ example: '529.982.247-25', description: 'Com ou sem máscara' })
  @NormalizeDocument()
  @IsCpf()
  cpf: string;

  @ApiProperty({ example: 'SenhaForte123' })
  @IsString({ message: 'Senha deve ser um texto' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  senha: string;
}
