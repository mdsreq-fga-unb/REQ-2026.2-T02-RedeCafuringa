import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Política de senha do cadastro: 8 a 128 caracteres, com letra e número. */
export const PASSWORD_POLICY =
  '8 a 128 caracteres, com pelo menos uma letra e um número';

export function StrongPassword() {
  return applyDecorators(
    ApiProperty({ example: 'SenhaForte123', description: PASSWORD_POLICY }),
    IsString({ message: 'Senha deve ser um texto' }),
    MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' }),
    // Limite superior evita DoS pelo custo do argon2 com entradas gigantes.
    MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' }),
    Matches(/[A-Za-z]/, { message: 'Senha deve conter pelo menos uma letra' }),
    Matches(/\d/, { message: 'Senha deve conter pelo menos um número' }),
  );
}
