import { ApiProperty } from '@nestjs/swagger';

/** Resposta do pedido de recuperação: idêntica exista ou não a conta (RNF11). */
export class PasswordResetRequestedResponse {
  @ApiProperty({
    example:
      'Se houver uma conta com esse e-mail, você receberá as instruções para recuperar o acesso.',
    description: 'Mensagem genérica, igual para e-mails cadastrados ou não',
  })
  mensagem: string;
}

export class ResetTokenValidResponse {
  @ApiProperty({
    example: true,
    description: 'Sempre true: link inválido ou expirado responde 400',
  })
  valido: boolean;
}

export class PasswordResetDoneResponse {
  @ApiProperty({
    example: 'Recuperação de acesso concluída. Entre com a nova senha.',
    description: 'Confirmação de que a recuperação foi concluída',
  })
  mensagem: string;
}
