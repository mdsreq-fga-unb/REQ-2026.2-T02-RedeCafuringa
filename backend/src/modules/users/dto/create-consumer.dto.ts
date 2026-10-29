import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IsCpf,
  NormalizeDocument,
} from '../../../common/validators/is-cpf.decorator.js';

/** Dados obrigatórios do consumidor (RN02) + maioridade (RN15) + senha. */
export class CreateConsumerDto {
  @ApiProperty({ example: 'Maria das Graças' })
  @IsString({ message: 'Nome deve ser um texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(120, { message: 'Nome deve ter no máximo 120 caracteres' })
  nome: string;

  @ApiProperty({ example: '529.982.247-25', description: 'Com ou sem máscara' })
  @NormalizeDocument()
  @IsCpf()
  cpf: string;

  @ApiProperty({ example: '61999990000', description: 'DDD + número' })
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve ter DDD e número, apenas dígitos (10 ou 11)',
  })
  telefone: string;

  @ApiProperty({ example: 'maria@exemplo.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(254, { message: 'E-mail deve ter no máximo 254 caracteres' })
  email: string;

  @ApiProperty({ example: '1990-05-10', description: 'AAAA-MM-DD' })
  @IsDateString(
    { strict: true },
    { message: 'Data de nascimento deve estar no formato AAAA-MM-DD' },
  )
  dataNascimento: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: '8 a 128 caracteres, com pelo menos uma letra e um número',
  })
  @IsString({ message: 'Senha deve ser um texto' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  // Limite superior evita DoS pelo custo do argon2 com entradas gigantes.
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(/[A-Za-z]/, { message: 'Senha deve conter pelo menos uma letra' })
  @Matches(/\d/, { message: 'Senha deve conter pelo menos um número' })
  senha: string;
}
