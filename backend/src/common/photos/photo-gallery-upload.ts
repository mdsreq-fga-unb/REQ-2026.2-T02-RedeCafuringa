import {
  applyDecorators,
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  HttpException,
  Injectable,
  type NestInterceptor,
  PayloadTooLargeException,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { catchError, type Observable } from 'rxjs';
import type { PhotoGalleryPolicy } from './photo-gallery.policy.js';

const MB = 1024 * 1024;
/** Campos de texto que acompanham as fotos num mesmo formulário. */
const MAX_TEXT_FIELDS = 12;
const MAX_TEXT_FIELD_BYTES = 16 * 1024;

/**
 * O multer responde em inglês ("File too large", "Too many files"). O front
 * mostra a mensagem a quem está cadastrando (RNF03), então ela é traduzida
 * aqui com os limites da política.
 */
@Injectable()
export class PhotoUploadErrorsInterceptor implements NestInterceptor {
  constructor(private readonly policy: PhotoGalleryPolicy) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        throw this.translate(error);
      }),
    );
  }

  private translate(error: unknown): unknown {
    if (!(error instanceof HttpException)) return error;
    if (error instanceof PayloadTooLargeException) {
      return new PayloadTooLargeException(
        `Cada foto deve ter no máximo ${this.policy.maxBytesPorFoto / MB} MB`,
      );
    }
    if (!(error instanceof BadRequestException)) return error;
    switch (error.message) {
      case 'Too many files':
      case 'Unexpected field':
        return new BadRequestException([
          `Envie no máximo ${this.policy.max} fotos, todas no campo "${this.policy.campo}"`,
        ]);
      case 'Too many fields':
      case 'Too many parts':
      case 'Field value too long':
      case 'Field name too long':
        return new BadRequestException([
          'Formulário fora do contrato: confira os campos enviados',
        ]);
      default:
        return error;
    }
  }
}

/**
 * Rota que recebe uma galeria de fotos (multipart) junto com campos de texto.
 * Os arquivos ficam em memória (nunca tocam o disco; container read-only) e
 * chegam em `@UploadedFiles()`; valide e processe com `PhotoGalleryService.prepare`.
 */
export function PhotoGalleryUpload(policy: PhotoGalleryPolicy) {
  return applyDecorators(
    // O tradutor vem antes para envolver o upload.
    UseInterceptors(
      new PhotoUploadErrorsInterceptor(policy),
      FilesInterceptor(policy.campo, policy.max, {
        limits: {
          fileSize: policy.maxBytesPorFoto,
          files: policy.max,
          fields: MAX_TEXT_FIELDS,
          fieldSize: MAX_TEXT_FIELD_BYTES,
          parts: policy.max + MAX_TEXT_FIELDS,
        },
      }),
    ),
    ApiConsumes('multipart/form-data'),
  );
}
