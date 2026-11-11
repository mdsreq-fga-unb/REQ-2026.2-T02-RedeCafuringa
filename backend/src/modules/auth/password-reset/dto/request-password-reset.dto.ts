import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

/** HU10/CA02: o meio de contato associado à conta é o e-mail de acesso (RN05). */
export class RequestPasswordResetDto {
  @ApiProperty({
    example: 'maria@exemplo.com',
    description: 'E-mail cadastrado na conta (sem distinção de maiúsculas)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(254, { message: 'E-mail deve ter no máximo 254 caracteres' })
  email: string;
}
