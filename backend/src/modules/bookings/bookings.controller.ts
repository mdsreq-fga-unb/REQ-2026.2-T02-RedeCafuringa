import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
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
import { ReceivedBookingResponse } from './dto/received-booking.response.js';
import { RespondBookingDto } from './dto/respond-booking.dto.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Roles(Role.PRODUTOR)
  @Get('received')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar pré-reservas recebidas',
    description:
      'HU47/CA01: lista as solicitações vinculadas às experiências do produtor autenticado, sem expor dados privados dos envolvidos.',
  })
  @ApiOkResponse({ type: ReceivedBookingResponse, isArray: true })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  listReceived(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReceivedBookingResponse[]> {
    return this.bookings.listReceived(user.id);
  }

  @Roles(Role.PRODUTOR)
  @Get('received/:id')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar detalhes de pré-reserva recebida',
    description:
      'HU47/CA02 e CA05: apresenta os dados necessários à análise somente ao produtor responsável.',
  })
  @ApiOkResponse({ type: ReceivedBookingResponse })
  @ApiForbiddenResponse({
    description: 'A solicitação pertence a outro produtor',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Pré-reserva não encontrada',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  getReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ReceivedBookingResponse> {
    return this.bookings.getReceived(user.id, id);
  }

  @Roles(Role.PRODUTOR)
  @Patch('received/:id/response')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Responder pré-reserva recebida',
    description:
      'HU47/CA03-CA07: registra aceite ou recusa somente para uma solicitação pendente pertencente ao produtor autenticado.',
  })
  @ApiOkResponse({ type: ReceivedBookingResponse })
  @ApiBadRequestResponse({
    description: 'A resposta enviada é inválida',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'A solicitação não está mais pendente',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'A solicitação pertence a outro produtor',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Pré-reserva não encontrada',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RespondBookingDto,
  ): Promise<ReceivedBookingResponse> {
    return this.bookings.respond(user.id, id, dto);
  }

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
