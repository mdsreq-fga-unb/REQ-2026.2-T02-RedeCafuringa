import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../common/dto/error.response.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { Role } from '../users/domain/role.js';
import { BookingsService } from './bookings.service.js';
import { BookingResponse } from './dto/booking.response.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Roles(Role.CONSUMIDOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Solicitar pré-reserva de experiência',
    description:
      'HU44/RF44 (CA04-CA07): registra a solicitação do consumidor autenticado para uma experiência disponível. A solicitação nasce pendente e não confirma a experiência: aguarda a resposta do produtor (RN19). O solicitante vem do token, nunca do corpo. Data e horário seguem o horário de Brasília e não podem estar no passado. Exclusivo do perfil CONSUMIDOR (RNF08).',
  })
  @ApiCreatedResponse({
    type: BookingResponse,
    description: 'Solicitação registrada, aguardando o produtor (CA06)',
  })
  @ApiBadRequestResponse({
    description:
      'Campos ausentes ou inválidos, ou data e horário no passado (mensagens em `message`)',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Perfil diferente de consumidor (produtor ou administrador)',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description:
      'Experiência inexistente, indisponível ou de produtor desativado (CA07)',
    type: ErrorResponse,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponse> {
    return this.bookings.create(user.id, dto);
  }
}
