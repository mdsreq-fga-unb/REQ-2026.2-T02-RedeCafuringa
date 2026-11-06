import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../common/dto/error.response.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { Role } from '../users/domain/role.js';
import { SaveTrajectoryDto } from './dto/save-trajectory.dto.js';
import {
  OwnTrajectoryResponse,
  PublicTrajectoryResponse,
} from './dto/trajectory.response.js';
import { ProducerProfileService } from './producer-profile.service.js';

@ApiTags('producers')
@Controller('producers')
export class ProducerProfileController {
  constructor(private readonly profile: ProducerProfileService) {}

  // "me" é declarada antes de ":id" para não ser lida como um identificador.
  @Roles(Role.PRODUTOR)
  @Get('me/trajectory')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar a própria trajetória',
    description:
      'HU12 (CA01): devolve a trajetória, as atividades, o telefone e a visibilidade do telefone do produtor autenticado. Exclusivo do perfil PRODUTOR (RN01, RNF08).',
  })
  @ApiOkResponse({
    type: OwnTrajectoryResponse,
    description: 'Trajetória atual',
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Perfil diferente de produtor',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Conta de produtor inexistente ou desativada',
    type: ErrorResponse,
  })
  getOwn(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnTrajectoryResponse> {
    return this.profile.getOwn(user.id);
  }

  @Roles(Role.PRODUTOR)
  @Put('me/trajectory')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Registrar a própria trajetória',
    description:
      'HU12 (CA02-CA04, CA06, CA07): substitui a trajetória e as atividades do produtor autenticado; telefone e visibilidade só mudam se enviados; `telefone: null` remove o telefone cadastrado. Publicar a trajetória torna o perfil público visível. O dono é sempre quem está no token. É idempotente: reenviar o mesmo conteúdo após uma falha de conexão é seguro. Textos são simples (sem HTML) e limitados a 2000 caracteres.',
  })
  @ApiOkResponse({
    type: OwnTrajectoryResponse,
    description: 'Trajetória gravada',
  })
  @ApiBadRequestResponse({
    description:
      'Campos inválidos ou fora do contrato (mensagens em `message`)',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Perfil diferente de produtor',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Conta de produtor inexistente ou desativada',
    type: ErrorResponse,
  })
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveTrajectoryDto,
  ): Promise<OwnTrajectoryResponse> {
    return this.profile.save(user.id, dto);
  }

  @Public()
  @Get(':id/trajectory')
  @ApiOperation({
    summary: 'Consultar a trajetória pública de um produtor',
    description:
      'HU12 (CA05, RN07, RNF11): aberta a visitantes e consumidores. Traz somente dados destinados à divulgação; o telefone só aparece se o produtor autorizou. O perfil fica oculto (404) até o produtor publicar a trajetória. E-mail, CPF, CNPJ e nome do responsável nunca são expostos.',
  })
  @ApiOkResponse({
    type: PublicTrajectoryResponse,
    description: 'Dados públicos do produtor',
  })
  @ApiNotFoundResponse({
    description:
      'Produtor inexistente, desativado, sem trajetória publicada ou identificador inválido',
    type: ErrorResponse,
  })
  getPublic(@Param('id') id: string): Promise<PublicTrajectoryResponse> {
    return this.profile.getPublic(id);
  }
}
