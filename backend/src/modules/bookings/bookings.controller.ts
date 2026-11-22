import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
}
