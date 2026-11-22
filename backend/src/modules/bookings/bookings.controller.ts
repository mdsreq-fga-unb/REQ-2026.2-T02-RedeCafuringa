import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../common/dto/error.response.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { Role } from '../users/domain/role.js';
import { BookingsQueryService } from './bookings-query.service.js';
import { BookingsService } from './bookings.service.js';
import {
  BookingDetailResponse,
  BookingListResponse,
} from './dto/booking-detail.response.js';
import { BookingResponse } from './dto/booking.response.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ListBookingsQuery } from './dto/list-bookings.query.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly queries: BookingsQueryService,
  ) {}

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

  // `mine` e `received` vêm antes de `:id`, senão o Nest os trataria como id.
  @Roles(Role.CONSUMIDOR)
  @Get('mine')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar as minhas pré-reservas (consumidor)',
    description:
      'HU45/RF45 (CA01, CA02, CA06, CA07): solicitações feitas pela conta autenticada, da mais nova à mais antiga, com a situação gravada agora (RN21). Filtro opcional por `status` e paginação por `pagina`/`limite` (padrão 1 e 20, máximo 50). Sem solicitações devolve 200 com `itens` vazio. O dono vem do token, nunca da query (RNF08). Exclusivo do perfil CONSUMIDOR.',
  })
  @ApiOkResponse({
    type: BookingListResponse,
    description: 'Página de solicitações (pode vir vazia, CA06)',
  })
  @ApiBadRequestResponse({
    description:
      '`status` fora do ciclo de vida, `pagina`/`limite` inválidos ou filtro desconhecido (mensagens em `message`)',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBookingsQuery,
  ): Promise<BookingListResponse> {
    return this.queries.listMine(user.id, query);
  }

  @Roles(Role.PRODUTOR)
  @Get('received')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar as pré-reservas recebidas (produtor)',
    description:
      'HU45/RF45 (CA01, CA03, CA06, CA07): solicitações recebidas para as experiências do produtor autenticado, da mais nova à mais antiga, com a situação gravada agora (RN21). `contraparte` é o consumidor (só id e nome, RNF11). Filtro opcional por `status` e paginação como em `GET /bookings/mine`. Sem solicitações devolve 200 com `itens` vazio. Exclusivo do perfil PRODUTOR.',
  })
  @ApiOkResponse({
    type: BookingListResponse,
    description: 'Página de solicitações recebidas (pode vir vazia, CA06)',
  })
  @ApiBadRequestResponse({
    description:
      '`status` fora do ciclo de vida, `pagina`/`limite` inválidos ou filtro desconhecido (mensagens em `message`)',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  listReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBookingsQuery,
  ): Promise<BookingListResponse> {
    return this.queries.listReceived(user.id, query);
  }

  @Roles(Role.CONSUMIDOR, Role.PRODUTOR)
  @Get(':id')
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    example: '64b0c0ffee0000000000b001',
    description: 'Id da pré-reserva',
  })
  @ApiOperation({
    summary: 'Consultar uma pré-reserva',
    description:
      'HU45/RF45 (CA04, CA05, CA07): detalhe de uma solicitação com a experiência e o outro lado. O consumidor só vê as suas e o produtor só as recebidas; qualquer outra, inexistente ou com id inválido responde 404, sem revelar se existe (RN20, RNF08, RNF11). Mostra a situação atualmente gravada.',
  })
  @ApiOkResponse({ type: BookingDetailResponse })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description:
      'Solicitação inexistente, de outra conta ou de experiência de outro produtor, ou id inválido (CA05)',
    type: ErrorResponse,
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingDetailResponse> {
    return this.queries.findOne(user, id);
  }
}
