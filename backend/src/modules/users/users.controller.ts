import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
import { AuthThrottle } from '../auth/decorators/auth-throttle.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { Role } from './domain/role.js';
import { AdminResponse } from './dto/admin.response.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import {
  CreateConsumerDto,
  UpdateConsumerNameDto,
} from './dto/create-consumer.dto.js';
import {
  CheckProducerIdentityDto,
  CreateProducerDto,
  ProducerAccountDto,
} from './dto/create-producer.dto.js';
import { DeleteUserQuery } from './dto/delete-user.query.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import { ProducerResponse } from './dto/producer.response.js';
import { UserDetailResponse } from './dto/user-detail.response.js';
import { UserListResponse } from './dto/user-list.response.js';
import { UserResponse } from './dto/user.response.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly deletion: AccountDeletionService,
  ) {}

  /** HU01 — cadastro público de consumidor. */
  @Public()
  @AuthThrottle()
  @Post('consumers')
  @ApiOperation({
    summary: 'Cadastrar consumidor',
    description:
      'Cadastro público (HU01): nome completo, CPF, e-mail e senha (RF01). Data de nascimento é obrigatória e exige 18 anos ou mais (RNF15); telefone é opcional. O CPF é validado, normalizado e guardado cifrado; a resposta traz o CPF mascarado.',
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

  @Roles(Role.CONSUMIDOR)
  @Put('consumers/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Alterar nome da consumidora',
    description: 'Atualiza apenas o nome da titular da sessão.',
  })
  @ApiNoContentResponse({ description: 'Nome atualizado' })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  updateConsumerName(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateConsumerNameDto,
  ): Promise<void> {
    return this.users.updateConsumerName(user.id, dto.nome);
  }

  @Public()
  @AuthThrottle()
  @Post('producers/check-identity')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Validar CPF, CNPJ e e-mail antes de avançar no cadastro',
    description:
      'Verifica se os dados podem ser usados no cadastro sem criar a conta.',
  })
  @ApiNoContentResponse({ description: 'Dados disponíveis para cadastro' })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiConflictResponse({ type: ErrorResponse })
  @ApiTooManyRequestsResponse({
    type: ErrorResponse,
    headers: RETRY_AFTER_HEADER,
  })
  async checkProducerIdentity(
    @Body() dto: CheckProducerIdentityDto,
  ): Promise<void> {
    await this.users.checkProducerIdentity(dto);
  }

  @Roles(Role.PRODUTOR)
  @Get('producers/me')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar conta da produtora',
    description: 'Retorna os dados da iniciativa da titular da sessão.',
  })
  @ApiOkResponse({ type: ProducerAccountDto })
  getProducerAccount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProducerAccountDto> {
    return this.users.getProducerAccount(user.id);
  }

  @Roles(Role.PRODUTOR)
  @Put('producers/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Atualizar conta da produtora',
    description:
      'Salva iniciativa, categoria e formas de pagamento da titular.',
  })
  @ApiNoContentResponse({ description: 'Dados da conta salvos' })
  @ApiBadRequestResponse({ type: ErrorResponse })
  updateProducerAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProducerAccountDto,
  ): Promise<void> {
    return this.users.updateProducerAccount(user.id, dto);
  }

  /** HU02 — cadastro público de produtor. */
  @Public()
  @AuthThrottle()
  @Post('producers')
  @ApiOperation({
    summary: 'Cadastrar produtor',
    description:
      'Cadastro público da HU02. Documentos, e-mail e senha são protegidos conforme RNF11; o CPF é retornado mascarado.',
  })
  @ApiCreatedResponse({
    type: ProducerResponse,
    description: 'Produtor criado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou campos obrigatórios ausentes',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'E-mail, CPF ou CNPJ já cadastrado',
    type: ErrorResponse,
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas tentativas',
    type: ErrorResponse,
    headers: RETRY_AFTER_HEADER,
  })
  async createProducer(
    @Body() dto: CreateProducerDto,
  ): Promise<ProducerResponse> {
    return this.users.toResponseProducer(await this.users.createProducer(dto));
  }

  /** HU03 — cadastro de administrador, exclusivo de administradores (RN03). */
  @Roles(Role.ADMINISTRADOR)
  @Post('admins')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Cadastrar administrador',
    description:
      'HU03: só um administrador autenticado cria outra conta administrativa, informando e-mail e senha. O primeiro administrador vem de ADMIN_BOOTSTRAP_EMAIL/ADMIN_BOOTSTRAP_SENHA.',
  })
  @ApiCreatedResponse({
    type: AdminResponse,
    description: 'Administrador criado',
  })
  @ApiBadRequestResponse({
    description: 'E-mail ou senha inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'E-mail já cadastrado',
    type: ErrorResponse,
  })
  async createAdmin(@Body() dto: CreateAdminDto): Promise<AdminResponse> {
    return this.users.toResponseAdmin(await this.users.createAdmin(dto));
  }

  /** HU04 — consulta de usuários, exclusiva de administradores (RN01, RN03). */
  @Roles(Role.ADMINISTRADOR)
  @Get()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Consultar usuários cadastrados',
    description:
      'HU04: lista consumidores, produtores e administradores em ordem alfabética, com filtro por perfil, busca por nome, e-mail ou iniciativa e paginação (até 50 por página). Nenhum item traz senha nem documentos (RNF11).',
  })
  @ApiOkResponse({
    type: UserListResponse,
    description: 'Página de usuários; lista vazia quando não há registros',
  })
  @ApiBadRequestResponse({
    description: 'Filtro ou paginação inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  list(@Query() query: ListUsersQuery): Promise<UserListResponse> {
    return this.users.list(query);
  }

  /** HU04 — detalhe de um usuário para o administrador. */
  @Roles(Role.ADMINISTRADOR)
  @Get(':id')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Detalhar usuário cadastrado',
    description:
      'HU04: dados de uma conta para o administrador, com CPF e CNPJ mascarados e sem senha (CA06, RNF11).',
  })
  @ApiOkResponse({ type: UserDetailResponse, description: 'Usuário' })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
    type: ErrorResponse,
  })
  findOne(@Param('id') id: string): Promise<UserDetailResponse> {
    return this.users.findDetail(id);
  }

  /** Exclusão administrativa de uma conta (RN01, RN03, RN04). */
  @Roles(Role.ADMINISTRADOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Excluir usuário',
    description:
      'Exclui definitivamente a conta e o que depende dela (produtos, experiências e fotos, foto de perfil e pedidos de nova senha). As sessões abertas da conta deixam de valer na hora e o perfil e as ofertas saem do catálogo, da busca e do contato. Com o motivo INATIVIDADE, e-mail, CPF e CNPJ ficam livres para novo cadastro (RNF11); com DESCUMPRIMENTO_REGRAS, só o HMAC desses dados é guardado e um novo cadastro com eles é recusado com 403. Exige o motivo (RN04), registrado no log de auditoria sem dados pessoais. O administrador não exclui a própria conta nem a conta administrativa inicial.',
  })
  @ApiNoContentResponse({ description: 'Conta excluída' })
  @ApiBadRequestResponse({
    description: 'Motivo ausente ou inválido',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Perfil diferente de administrador',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Conta inexistente ou já excluída',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description:
      'A própria conta ou a conta administrativa inicial, que não podem ser excluídas',
    type: ErrorResponse,
  })
  remove(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Query() { motivo }: DeleteUserQuery,
  ): Promise<void> {
    return this.deletion.delete(admin.id, id, motivo);
  }
}
