import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ErrorResponse,
  RETRY_AFTER_HEADER,
} from '../../common/dto/error.response.js';
import { UserResponse } from '../users/dto/user.response.js';
import { AuthService } from './auth.service.js';
import { AuthThrottle } from './decorators/auth-throttle.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponse } from './dto/login.response.js';
import type { AuthenticatedUser } from './types/authenticated-user.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @AuthThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar com CPF e senha',
    description:
      'Troca CPF e senha (RN08) por um JWT, válido por `expiresIn` segundos. Rota pública com limite estrito de tentativas por IP.',
  })
  @ApiOkResponse({ type: LoginResponse, description: 'Autenticado' })
  @ApiBadRequestResponse({
    description: 'Payload inválido (as mensagens vêm em `message`)',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'CPF ou senha inválidos',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Conta desativada',
    type: ErrorResponse,
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas tentativas',
    type: ErrorResponse,
    headers: RETRY_AFTER_HEADER,
  })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto.cpf, dto.senha);
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Dados do usuário autenticado',
    description:
      'Devolve o perfil de quem é dono do token. CPF sempre mascarado.',
  })
  @ApiOkResponse({ type: UserResponse, description: 'Perfil do usuário' })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.auth.profile(user.id);
  }
}
