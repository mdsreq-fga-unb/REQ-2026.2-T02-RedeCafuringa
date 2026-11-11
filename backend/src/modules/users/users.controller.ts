import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from './domain/role.js';
import { AdminResponse } from './dto/admin.response.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { CreateConsumerDto } from './dto/create-consumer.dto.js';
import { CreateProducerDto } from './dto/create-producer.dto.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import { ProducerResponse } from './dto/producer.response.js';
import { UserDetailResponse } from './dto/user-detail.response.js';
import { UserListResponse } from './dto/user-list.response.js';
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
}
