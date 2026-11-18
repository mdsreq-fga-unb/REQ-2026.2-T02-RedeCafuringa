import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiNotModifiedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponse } from '../../common/dto/error.response.js';
import { PhotoGalleryUpload } from '../../common/photos/photo-gallery-upload.js';
import {
  PHOTO_GALLERY_POLICIES,
  PhotoOwnerType,
} from '../../common/photos/photo-gallery.policy.js';
import type { UploadedPhotoFile } from '../../common/photos/photo-gallery.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { Role } from '../users/domain/role.js';
import {
  DESCRICAO_MAX,
  ExperienceCategory,
  LOCAL_MAX,
  NOME_MAX,
  VALOR_MAX,
} from './domain/experience.js';
import { CreateExperienceDto } from './dto/create-experience.dto.js';
import {
  ExperienceListResponse,
  ExperienceResponse,
} from './dto/experience.response.js';
import { ListExperiencesQuery } from './dto/list-experiences.query.js';
import { ExperiencesService } from './experiences.service.js';

/** Versão certa na URL: o conteúdo nunca muda, pode ficar em cache para sempre. */
const IMMUTABLE = 'public, max-age=31536000, immutable';
/** HU24 CA06: pode guardar, mas sempre revalida (ETag) antes de mostrar. */
const CATALOG_CACHE = 'no-cache';
const FOTOS = PHOTO_GALLERY_POLICIES[PhotoOwnerType.EXPERIENCIA];
const MB = 1024 * 1024;

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Roles(Role.PRODUTOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @PhotoGalleryUpload(FOTOS)
  @ApiBearerAuth('bearer')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Opcional. Identificador gerado pelo app para este cadastro (8 a 64 letras, números, "-" ou "_"). Reenviar com a mesma chave após uma falha de conexão devolve a experiência já criada, sem duplicar (CA07).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'nome',
        'categoria',
        'descricao',
        'valorPorPessoa',
        'local',
        'duracao',
        'fotos',
      ],
      properties: {
        nome: { type: 'string', maxLength: NOME_MAX },
        categoria: { type: 'string', enum: Object.values(ExperienceCategory) },
        descricao: { type: 'string', maxLength: DESCRICAO_MAX },
        valorPorPessoa: {
          type: 'number',
          minimum: 0,
          maximum: VALOR_MAX,
          description: 'Reais, com ponto e até 2 casas decimais',
        },
        local: { type: 'string', maxLength: LOCAL_MAX },
        duracao: {
          type: 'string',
          example: '2 horas',
          description: 'Número inteiro seguido de minutos ou horas',
        },
        [FOTOS.campo]: {
          type: 'array',
          minItems: FOTOS.min,
          maxItems: FOTOS.max,
          items: { type: 'string', format: 'binary' },
          description: `De ${FOTOS.min} a ${FOTOS.max} imagens PNG, JPEG ou WebP de até ${FOTOS.maxBytesPorFoto / MB} MB cada, na ordem da galeria (a primeira é a capa)`,
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Cadastrar experiência',
    description: `HU21/RF21 (CA02-CA05, CA07): cadastra uma experiência, atividade ou atrativo do produtor autenticado, que fica vinculada à conta do token (RN09). Exclusivo do perfil PRODUTOR (RN01, RNF08). Textos são simples (sem HTML). As fotos (${FOTOS.min} a ${FOTOS.max}) têm o formato conferido pelos bytes e são regravadas em WebP sem metadados (EXIF/GPS).`,
  })
  @ApiCreatedResponse({
    type: ExperienceResponse,
    description: 'Experiência cadastrada',
  })
  @ApiBadRequestResponse({
    description:
      'Campos ausentes ou inválidos, sem foto, fotos demais ou ilegíveis (mensagens em `message`)',
    type: ErrorResponse,
  })
  @ApiPayloadTooLargeResponse({
    description: `Alguma foto acima de ${FOTOS.maxBytesPorFoto / MB} MB`,
    type: ErrorResponse,
  })
  @ApiUnsupportedMediaTypeResponse({
    description: 'Alguma foto não é PNG, JPEG ou WebP',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Sem token ou token inválido',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description:
      'Perfil diferente de produtor (consumidor ou administrador) (CA06)',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Conta de produtor inexistente ou desativada',
    type: ErrorResponse,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExperienceDto,
    @UploadedFiles() files: UploadedPhotoFile[] | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): Promise<ExperienceResponse> {
    return this.experiences.create(user.id, dto, files, idempotencyKey);
  }

  @Public()
  @Get()
  // HU24 CA06: o catálogo muda a qualquer momento (cadastro, retirada da
  // oferta, produtor desativado). `no-cache` obriga navegador e proxies a
  // revalidar a cada acesso; o ETag do Express devolve 304 sem corpo quando
  // nada mudou, o que poupa dados em conexões lentas (RNF06).
  @Header('Cache-Control', CATALOG_CACHE)
  @ApiOperation({
    summary: 'Consultar o catálogo de experiências',
    description:
      'HU24/RF24 (CA01-CA04, CA06-CA08, RN10): catálogo público, sem login. Só experiências disponíveis de produtores ativos, da mais nova à mais antiga, paginadas; sem resultados, `itens` vem vazio. `produtor` restringe ao catálogo de um perfil. Cada item tem o mesmo formato de `GET /experiences/{id}`. A resposta traz `ETag` e `Cache-Control: no-cache`: reenvie o `ETag` em `If-None-Match` para receber 304 quando o catálogo não mudou.',
  })
  @ApiHeader({
    name: 'If-None-Match',
    required: false,
    description:
      'ETag de uma consulta anterior. Se o catálogo não mudou, a resposta é 304 sem corpo (CA06, RNF06).',
  })
  @ApiOkResponse({
    type: ExperienceListResponse,
    description: 'Página do catálogo',
    headers: {
      ETag: {
        description: 'Versão desta página do catálogo',
        schema: { type: 'string' },
      },
      'Cache-Control': {
        description: 'Sempre `no-cache`: revalidar a cada acesso (CA06)',
        schema: { type: 'string', example: CATALOG_CACHE },
      },
    },
  })
  @ApiNotModifiedResponse({
    description: 'O catálogo não mudou desde o `ETag` enviado (CA06)',
  })
  @ApiBadRequestResponse({
    description: 'Filtro ou paginação inválidos',
    type: ErrorResponse,
  })
  list(@Query() query: ListExperiencesQuery): Promise<ExperienceListResponse> {
    return this.experiences.list(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Consultar uma experiência',
    description:
      'HU21 (CA08, RN11): aberta a visitantes e consumidores. Traz os dados da oferta e o responsável (id, nome da iniciativa e localidade). Experiências indisponíveis ou de produtor desativado não aparecem.',
  })
  @ApiOkResponse({ type: ExperienceResponse, description: 'Experiência' })
  @ApiNotFoundResponse({
    description:
      'Experiência inexistente, indisponível, de produtor desativado ou identificador inválido',
    type: ErrorResponse,
  })
  getOne(@Param('id') id: string): Promise<ExperienceResponse> {
    return this.experiences.getPublic(id);
  }

  @Public()
  @Get(':id/photos/:photoId')
  @ApiProduces('image/webp')
  @ApiQuery({
    name: 'v',
    required: false,
    description:
      'Versão da foto, como vem em `fotos`. Com a versão atual a resposta fica em cache para sempre; sem ela, o navegador revalida.',
  })
  @ApiOperation({
    summary: 'Foto de uma experiência',
    description:
      'HU21: visível nas mesmas condições da experiência. Use o caminho de `fotos`. Responde com `ETag` e aceita `If-None-Match`.',
  })
  @ApiOkResponse({
    description: 'Imagem WebP sem metadados',
    content: {
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiNotModifiedResponse({ description: 'O navegador já tem esta versão' })
  @ApiNotFoundResponse({
    description: 'Experiência ou foto inexistente, ou experiência não visível',
    type: ErrorResponse,
  })
  async getPhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Query('v') version: string | undefined,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const photo = await this.experiences.getPublicPhoto(id, photoId);
    const etag = `"${photo.versao}"`;

    res.set({
      ETag: etag,
      'Cache-Control': version === photo.versao ? IMMUTABLE : 'no-cache',
      // O helmet bloqueia o uso por outra origem, e o front pode ser servido em outra.
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    if (ifNoneMatch === etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }
    return new StreamableFile(photo.dados, {
      type: photo.tipo,
      length: photo.dados.length,
      disposition: 'inline; filename="foto.webp"',
    });
  }
}
