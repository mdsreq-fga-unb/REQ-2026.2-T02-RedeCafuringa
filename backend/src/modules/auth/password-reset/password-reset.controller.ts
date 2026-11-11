import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  ErrorResponse,
  RETRY_AFTER_HEADER,
} from '../../../common/dto/error.response.js';
import { AuthThrottle } from '../decorators/auth-throttle.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto.js';
import {
  PasswordResetDoneResponse,
  PasswordResetRequestedResponse,
  ResetTokenValidResponse,
} from './dto/password-reset.response.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto.js';
import { PasswordResetService } from './password-reset.service.js';

const TOO_MANY = {
  description: 'Muitas tentativas',
  type: ErrorResponse,
  headers: RETRY_AFTER_HEADER,
} as const;

@ApiTags('auth')
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordReset: PasswordResetService) {}

  @Public()
  @AuthThrottle()
  @Post('request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Solicitar recuperação de acesso',
    description:
      'HU10 (CA02/CA03, RN05): se o e-mail pertencer a uma conta ativa, envia a ele um link de uso único, válido por tempo limitado. A resposta é sempre a mesma, exista ou não a conta, para não revelar quem está cadastrado. Pedidos seguidos para a mesma conta respeitam um intervalo mínimo e cada novo pedido invalida o link anterior.',
  })
  @ApiAcceptedResponse({
    type: PasswordResetRequestedResponse,
    description: 'Pedido recebido (resposta genérica)',
  })
  @ApiBadRequestResponse({
    description: 'E-mail em formato inválido',
    type: ErrorResponse,
  })
  @ApiTooManyRequestsResponse(TOO_MANY)
  request(
    @Body() dto: RequestPasswordResetDto,
  ): PasswordResetRequestedResponse {
    // Não aguarda: o processamento roda depois da resposta (tempo constante).
    this.passwordReset.request(dto.email);
    return {
      mensagem:
        'Se houver uma conta com esse e-mail, você receberá as instruções para recuperar o acesso.',
    };
  }

  @Public()
  @AuthThrottle()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar link de recuperação',
    description:
      'HU10 (CA04): confirma se o token do link ainda permite redefinir a senha, para o front decidir se mostra a etapa de nova senha. Não consome o link. O token vai no corpo, nunca na URL, para não parar em logs de acesso.',
  })
  @ApiOkResponse({
    type: ResetTokenValidResponse,
    description: 'Link válido',
  })
  @ApiBadRequestResponse({
    description: 'Link inválido, expirado ou já utilizado',
    type: ErrorResponse,
  })
  @ApiTooManyRequestsResponse(TOO_MANY)
  async validate(
    @Body() dto: ValidateResetTokenDto,
  ): Promise<ResetTokenValidResponse> {
    await this.passwordReset.validate(dto.token);
    return { valido: true };
  }

  @Public()
  @AuthThrottle()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefinir a senha',
    description:
      'HU10 (CA05/CA06): troca a senha da conta dona do link e o consome. A nova senha segue a política do cadastro. Uma senha inválida não consome o link; link inválido, expirado ou já usado responde 400 com orientação para solicitar outro.',
  })
  @ApiOkResponse({
    type: PasswordResetDoneResponse,
    description: 'Senha redefinida',
  })
  @ApiBadRequestResponse({
    description: 'Senha fora da política ou link inválido, expirado ou usado',
    type: ErrorResponse,
  })
  @ApiTooManyRequestsResponse(TOO_MANY)
  async confirm(
    @Body() dto: ConfirmPasswordResetDto,
  ): Promise<PasswordResetDoneResponse> {
    await this.passwordReset.confirm(dto.token, dto.novaSenha);
    return {
      mensagem: 'Recuperação de acesso concluída. Entre com a nova senha.',
    };
  }
}
