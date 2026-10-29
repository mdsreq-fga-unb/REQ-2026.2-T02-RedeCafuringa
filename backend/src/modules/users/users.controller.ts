import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  ErrorResponse,
  RETRY_AFTER_HEADER,
} from '../../common/dto/error.response.js';
import { AuthThrottle } from '../auth/decorators/auth-throttle.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CreateConsumerDto } from './dto/create-consumer.dto.js';
import { UserResponse } from './dto/user.response.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** HU01 — cadastro público de consumidor. */
  @Public()
  @AuthThrottle()
  @Post('consumers')
  @ApiOperation({
    summary: 'Cadastrar consumidor',
    description:
      'Cadastro público (HU01): dados obrigatórios (RN02), maioridade (RN15) e senha. O CPF é validado, normalizado e guardado cifrado; a resposta traz o CPF mascarado.',
  })
  @ApiCreatedResponse({ type: UserResponse, description: 'Consumidor criado' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou menor de 18 anos',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'CPF já cadastrado',
    type: ErrorResponse,
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas tentativas',
    type: ErrorResponse,
    headers: RETRY_AFTER_HEADER,
  })
  async createConsumer(@Body() dto: CreateConsumerDto): Promise<UserResponse> {
    return this.users.toResponse(await this.users.createConsumer(dto));
  }
}
