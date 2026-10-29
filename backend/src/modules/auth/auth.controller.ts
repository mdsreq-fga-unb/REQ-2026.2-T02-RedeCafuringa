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
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
  @ApiOkResponse({ type: LoginResponse })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiUnauthorizedResponse({ description: 'CPF ou senha inválidos' })
  @ApiForbiddenResponse({ description: 'Conta desativada' })
  @ApiTooManyRequestsResponse({ description: 'Muitas tentativas' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto.cpf, dto.senha);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.auth.profile(user.id);
  }
}
