import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
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
  @ApiCreatedResponse({ type: UserResponse })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou menor de 18 anos' })
  @ApiConflictResponse({ description: 'CPF já cadastrado' })
  @ApiTooManyRequestsResponse({ description: 'Muitas tentativas' })
  async createConsumer(@Body() dto: CreateConsumerDto): Promise<UserResponse> {
    return this.users.toResponse(await this.users.createConsumer(dto));
  }
}
