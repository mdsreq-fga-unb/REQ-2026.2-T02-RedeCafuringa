import {
  Body,
  Controller,
  Get,
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
  GRAMAS_MAX,
  NOME_MAX,
  PRECO_MAX,
  ProductCategory,
} from './domain/product.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ListProductsQuery } from './dto/list-products.query.js';
import { ProductListResponse } from './dto/product-list.response.js';
import { ProductResponse } from './dto/product.response.js';
import { ProductsService } from './products.service.js';

/** Versão certa na URL: o conteúdo nunca muda, pode ficar em cache para sempre. */
const IMMUTABLE = 'public, max-age=31536000, immutable';
const FOTOS = PHOTO_GALLERY_POLICIES[PhotoOwnerType.PRODUTO];
const MB = 1024 * 1024;

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Roles(Role.PRODUTOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @PhotoGalleryUpload(FOTOS)
  @ApiBearerAuth('bearer')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Opcional. Identificador gerado pelo app para este cadastro (8 a 64 letras, números, "-" ou "_"). Reenviar com a mesma chave após uma falha de conexão devolve o produto já criado, sem duplicar (CA07).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'nome',
        'categoria',
        'descricao',
        'precoPorUnidade',
        'gramasPorUnidade',
        'fotos',
      ],
      properties: {
        nome: { type: 'string', maxLength: NOME_MAX },
        categoria: { type: 'string', enum: Object.values(ProductCategory) },
        descricao: { type: 'string', maxLength: DESCRICAO_MAX },
        precoPorUnidade: {
          type: 'number',
          minimum: 0,
          maximum: PRECO_MAX,
          description: 'Reais, com ponto e até 2 casas decimais',
        },
        gramasPorUnidade: {
          type: 'number',
          minimum: 0,
          exclusiveMinimum: true,
          maximum: GRAMAS_MAX,
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
    summary: 'Cadastrar produto',
    description: `HU15/RF15 (CA02-CA05, CA07): cadastra um produto do produtor autenticado, que fica vinculado à conta do token (RN09). Exclusivo do perfil PRODUTOR (RN01, RNF08). Textos são simples (sem HTML). As fotos (${FOTOS.min} a ${FOTOS.max}) passam pelo mesmo tratamento da foto de perfil: formato conferido pelos bytes e regravação em WebP sem metadados (EXIF/GPS).`,
  })
  @ApiCreatedResponse({
    type: ProductResponse,
    description: 'Produto cadastrado',
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
    description: 'Perfil diferente de produtor (consumidor ou administrador)',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Conta de produtor inexistente ou desativada',
    type: ErrorResponse,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: UploadedPhotoFile[] | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): Promise<ProductResponse> {
    return this.products.create(user.id, dto, files, idempotencyKey);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Consultar o catálogo de produtos',
    description:
      'Catálogo público (RF19/HU19; CA08 da HU15): produtos disponíveis de produtores ativos, do mais novo ao mais antigo, paginados. `produtor` restringe ao catálogo de um perfil; `categoria` filtra por tipo; `busca` procura no nome do produto e no nome da iniciativa, sem diferenciar acentos. Cada item tem o mesmo formato de `GET /products/{id}`.',
  })
  @ApiOkResponse({
    type: ProductListResponse,
    description: 'Página do catálogo',
  })
  @ApiBadRequestResponse({
    description: 'Filtro ou paginação inválidos',
    type: ErrorResponse,
  })
  list(@Query() query: ListProductsQuery): Promise<ProductListResponse> {
    return this.products.list(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Consultar um produto',
    description:
      'HU15 (CA08, RN11): aberta a visitantes e consumidores. Traz os dados da oferta e o responsável (id e nome da iniciativa). Produtos indisponíveis ou de produtor desativado não aparecem.',
  })
  @ApiOkResponse({ type: ProductResponse, description: 'Produto' })
  @ApiNotFoundResponse({
    description:
      'Produto inexistente, indisponível, de produtor desativado ou identificador inválido',
    type: ErrorResponse,
  })
  getOne(@Param('id') id: string): Promise<ProductResponse> {
    return this.products.getPublic(id);
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
    summary: 'Foto de um produto',
    description:
      'HU15: visível nas mesmas condições do produto. Use o caminho de `fotos`. Responde com `ETag` e aceita `If-None-Match`.',
  })
  @ApiOkResponse({
    description: 'Imagem WebP sem metadados',
    content: {
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiNotModifiedResponse({ description: 'O navegador já tem esta versão' })
  @ApiNotFoundResponse({
    description: 'Produto ou foto inexistente, ou produto não visível',
    type: ErrorResponse,
  })
  async getPhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Query('v') version: string | undefined,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const photo = await this.products.getPublicPhoto(id, photoId);
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
