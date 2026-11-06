import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Token recebido por e-mail, repassado pelo front a partir do link. */
export class ValidateResetTokenDto {
  @ApiProperty({
    example: 'k3Jf0wX9mQ2vB7nR1tYhA5cL8eZsU4dG6iOpP-_aXyE',
    description:
      'Token do link de recuperação enviado por e-mail (43 caracteres)',
  })
  @IsString({ message: 'Token deve ser um texto' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  @MaxLength(200, { message: 'Token inválido' })
  token: string;
}
