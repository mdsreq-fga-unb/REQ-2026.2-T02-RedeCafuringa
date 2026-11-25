import {
  Body,
  Header,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import { BookingPaymentService } from './booking-payment.service.js';
import { BookingsQueryService } from './bookings-query.service.js';
import { BookingsService } from './bookings.service.js';
import {
  BookingDetailResponse,
  BookingListResponse,
  BookingPaymentResponse,
} from './dto/booking-detail.response.js';
import { BookingNotificationResponse } from './dto/booking-notification.response.js';
import { BookingResponse } from './dto/booking.response.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ListBookingsQuery } from './dto/list-bookings.query.js';
import { ReceivedBookingResponse } from './dto/received-booking.response.js';
import { RespondBookingDto } from './dto/respond-booking.dto.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly queries: BookingsQueryService,
    private readonly payments: BookingPaymentService,
  ) {}

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
  @Get('notifications')
  @Header('Cache-Control', 'no-store')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar alterações das próprias pré-reservas',
    description:
      'HU48/RF48: lista aceites, recusas e cancelamentos registrados nas solicitações vinculadas à conta autenticada, da alteração mais recente à mais antiga.',
  })
  @ApiOkResponse({ type: [BookingNotificationResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  listNotifications(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BookingNotificationResponse[]> {
    return this.queries.listNotifications(user);
  }

  @Roles(Role.CONSUMIDOR, Role.PRODUTOR)
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    example: '64b0c0ffee0000000000b001',
    description: 'Id da pré-reserva',
  })
  @ApiOperation({
    summary: 'Consultar uma pré-reserva',
    description:
      'HU45/RF45 (CA04, CA05, CA07): detalhe de uma solicitação com a experiência e o outro lado. O consumidor só vê as suas e o produtor só as recebidas; qualquer outra, inexistente ou com id inválido responde 404, sem revelar se existe (RNF08, RNF11). Mostra a situação atualmente gravada.',
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

  @Roles(Role.CONSUMIDOR)
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'Id da pré-reserva a cancelar',
    example: '64b0c0ffee0000000000b001',
  })
  @ApiOperation({
    summary: 'Cancelar pré-reserva',
    description:
      'HU46/RF46 (CA02-CA07): o consumidor cancela a própria solicitação de pré-reserva. Sem corpo: a confirmação ("Sim, cancelar solicitação" / "Manter solicitação", CA02 e CA04) é da interface, que só chama este endpoint quando o usuário confirma. Só solicitações pendentes podem ser canceladas pelo solicitante (RN20); a situação passa a `cancelada` e nunca volta a `pendente` (RN21). A troca é atômica: cancelar de novo, ou cancelar depois de o produtor responder, devolve 409 e não altera nada. Solicitação de outro usuário responde 404, como se não existisse (CA05, RNF11). Exclusivo do perfil CONSUMIDOR (RNF08).',
  })
  @ApiOkResponse({
    type: BookingResponse,
    description: 'Solicitação cancelada, já com a situação atualizada (CA06)',
    example: {
      id: '64b0c0ffee0000000000b001',
      experienciaId: '64b0c0ffee0000000000e001',
      data: '2026-12-10',
      horario: '09:00',
      participantes: 4,
      formaPagamento: 'pix',
      mensagem: 'Vamos com duas crianças.',
      status: 'cancelada',
      criadoEm: '2026-11-21T12:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
    example: {
      statusCode: 401,
      message: 'Autenticação necessária',
      error: 'Unauthorized',
    },
  })
  @ApiForbiddenResponse({
    description: 'Perfil diferente de consumidor (produtor ou administrador)',
    type: ErrorResponse,
    example: {
      statusCode: 403,
      message: 'Seu perfil não tem permissão para acessar este recurso',
      error: 'Forbidden',
    },
  })
  @ApiNotFoundResponse({
    description:
      'Pré-reserva inexistente, com id inválido ou pertencente a outro usuário (CA05)',
    type: ErrorResponse,
    example: {
      statusCode: 404,
      message: 'Pré-reserva não encontrada',
      error: 'Not Found',
    },
  })
  @ApiConflictResponse({
    description:
      'A solicitação não está pendente: já aceita (só o produtor cancela), recusada ou já cancelada. Nada é alterado (RN20, RN21). A mensagem diz o motivo.',
    type: ErrorResponse,
    example: {
      statusCode: 409,
      message: 'Esta pré-reserva já foi cancelada',
      error: 'Conflict',
    },
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingResponse> {
    return this.bookings.cancel(user.id, id);
  }

  @Roles(Role.CONSUMIDOR)
  @Patch(':id/payment/sent')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', example: '64b0c0ffee0000000000b001' })
  @ApiOperation({
    summary: 'Avisar que pagou o sinal',
    description:
      'Pagamento por Pix: a consumidora avisa que pagou o sinal da própria pré-reserva aceita, dentro do prazo. O comprovante vai direto à produtora pelo WhatsApp; a API só registra o aviso (situação `comprovante-enviado`). Pré-reserva de outra conta responde 404. Exclusivo do perfil CONSUMIDOR.',
  })
  @ApiOkResponse({ type: BookingPaymentResponse })
  @ApiConflictResponse({
    description:
      'A situação não permite: prazo vencido, aviso já feito, sinal já confirmado ou dispensado. A mensagem diz o motivo.',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Pré-reserva não encontrada',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Perfil sem permissão',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  reportPaymentSent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingPaymentResponse> {
    return this.payments.reportSent(user.id, id);
  }

  @Roles(Role.PRODUTOR)
  @Patch('received/:id/payment/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', example: '64b0c0ffee0000000000b001' })
  @ApiOperation({
    summary: 'Confirmar o sinal recebido',
    description:
      'Pagamento por Pix: a produtora responsável confirma que o sinal caiu no extrato. Vale com o sinal por pagar ou depois do aviso da consumidora, mesmo depois do prazo (pagamento atrasado). Exclusivo do perfil PRODUTOR.',
  })
  @ApiOkResponse({ type: BookingPaymentResponse })
  @ApiConflictResponse({
    description:
      'A situação não permite: sinal já confirmado, dispensado ou pré-reserva não aceita. A mensagem diz o motivo.',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'A pré-reserva é de outro produtor, ou perfil sem permissão',
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
  confirmPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingPaymentResponse> {
    return this.payments.confirm(user.id, id);
  }

  @Roles(Role.PRODUTOR)
  @Patch('received/:id/payment/not-found')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', example: '64b0c0ffee0000000000b001' })
  @ApiOperation({
    summary: 'Informar que o sinal não foi encontrado',
    description:
      'Pagamento por Pix: depois do aviso da consumidora, a produtora informa que não encontrou o Pix no extrato. A pré-reserva volta a aguardar o sinal, com o prazo de antes. Exclusivo do perfil PRODUTOR.',
  })
  @ApiOkResponse({ type: BookingPaymentResponse })
  @ApiConflictResponse({
    description:
      'A consumidora ainda não avisou o pagamento, ou o sinal já foi confirmado. A mensagem diz o motivo.',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'A pré-reserva é de outro produtor, ou perfil sem permissão',
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
  reportPaymentNotFound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingPaymentResponse> {
    return this.payments.reportNotFound(user.id, id);
  }
}
