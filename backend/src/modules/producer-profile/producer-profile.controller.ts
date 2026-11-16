import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { Role } from '../users/domain/role.js';
import { PHOTO_MAX_BYTES } from './domain/profile-photo.js';
import { PhotoResponse } from './dto/photo.response.js';
import { SaveTrajectoryDto } from './dto/save-trajectory.dto.js';
import {
  OwnTrajectoryResponse,
  PublicTrajectoryResponse,
} from './dto/trajectory.response.js';
import {
  ProducerPhotoService,
  type UploadedPhoto,
} from './producer-photo.service.js';
import { ProducerProfileService } from './producer-profile.service.js';

/** Versão certa na URL: o conteúdo nunca muda, pode ficar em cache para sempre. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

@ApiTags('producers')
@Controller('producers')
export class ProducerProfileController {
  constructor(
    private readonly profile: ProducerProfileService,
    private readonly photo: ProducerPhotoService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Consultar perfis públicos de produtores',
    description:
      'HU14 (CA01-CA05): lista produtores ativos que publicaram a trajetória. Retorna somente informações públicas; o telefone aparece apenas com autorização. E-mail, CPF e CNPJ nunca são expostos (RN07, RNF11).',
  })
  @ApiOkResponse({
    type: [PublicTrajectoryResponse],
    description: 'Perfis públicos disponíveis',
  })
  listPublic(): Promise<PublicTrajectoryResponse[]> {
    return this.profile.listPublic();
  }

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

  @Roles(Role.PRODUTOR)
  @Put('me/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    // Em memória: o arquivo é reprocessado e nunca toca o disco (container read-only).
    FileInterceptor('foto', {
      limits: { fileSize: PHOTO_MAX_BYTES, files: 1, fields: 0 },
    }),
  )
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['foto'],
      properties: {
        foto: {
          type: 'string',
          format: 'binary',
          description: 'PNG, JPEG ou WebP de até 5 MB',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Enviar a própria foto de perfil',
    description:
      'HU12/RF12: substitui a foto do produtor autenticado. O formato é conferido pelo conteúdo do arquivo (PNG, JPEG ou WebP; até 5 MB e 50 megapixels). A imagem é regravada em WebP de no máximo 960 px, já na orientação correta e **sem metadados** (EXIF, GPS), para não expor a localização da propriedade (RNF11). Reenviar a mesma foto é seguro (CA07). Recomenda-se reduzir a foto no aparelho antes de enviar (RNF06).',
  })
  @ApiOkResponse({ type: PhotoResponse, description: 'Foto gravada' })
  @ApiBadRequestResponse({
    description: 'Arquivo ausente, ilegível ou com dimensões fora do limite',
    type: ErrorResponse,
  })
  @ApiPayloadTooLargeResponse({
    description: 'Arquivo acima de 5 MB',
    type: ErrorResponse,
  })
  @ApiUnsupportedMediaTypeResponse({
    description: 'Arquivo que não é PNG, JPEG ou WebP',
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
  savePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedPhoto | undefined,
  ): Promise<PhotoResponse> {
    return this.photo.save(user.id, file);
  }

  @Roles(Role.PRODUTOR)
  @Delete('me/photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Remover a própria foto de perfil',
    description:
      'HU12/RF12: apaga a foto do produtor autenticado. Idempotente: remover sem ter foto também devolve 204.',
  })
  @ApiNoContentResponse({ description: 'Foto removida' })
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
  removePhoto(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.photo.remove(user.id);
  }

  @Public()
  @Get(':id/photo')
  @ApiProduces('image/webp')
  @ApiQuery({
    name: 'v',
    required: false,
    description:
      'Versão da foto, como vem em `fotoUrl`. Com a versão atual a resposta fica em cache para sempre; sem ela, o navegador revalida.',
  })
  @ApiOperation({
    summary: 'Foto pública de um produtor',
    description:
      'HU12/RF12 (CA05, RN07): visível nas mesmas condições do perfil público (produtor ativo e trajetória publicada). Use o caminho de `fotoUrl`. Responde com `ETag` e aceita `If-None-Match`.',
  })
  @ApiOkResponse({
    description: 'Imagem WebP sem metadados',
    content: {
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiNotModifiedResponse({ description: 'O navegador já tem esta versão' })
  @ApiNotFoundResponse({
    description:
      'Produtor inexistente, desativado, sem trajetória publicada, sem foto ou identificador inválido',
    type: ErrorResponse,
  })
  async getPhoto(
    @Param('id') id: string,
    @Query('v') version: string | undefined,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const photo = await this.photo.getPublic(id);
    const etag = `"${photo.versao}"`;

    res.set({
      ETag: etag,
      // Versão atual: cache permanente. Sem versão ou com versão antiga:
      // revalida sempre, para nunca mostrar uma foto que o produtor já trocou.
      'Cache-Control': version === photo.versao ? IMMUTABLE : 'no-cache',
      // O helmet bloqueia o uso por outra origem, e o front é servido em outra.
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
