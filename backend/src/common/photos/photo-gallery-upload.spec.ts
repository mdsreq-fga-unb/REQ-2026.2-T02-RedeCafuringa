import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { firstValueFrom, throwError } from 'rxjs';
import { PhotoUploadErrorsInterceptor } from './photo-gallery-upload.js';
import { maxRequestBytes } from './photo-gallery.policy.js';

// Política fictícia: as mensagens devem refletir os limites de cada galeria.
const policy = {
  campo: 'imagens',
  min: 1,
  max: 3,
  maxBytesPorFoto: 2 * 1024 * 1024,
};
const interceptor = new PhotoUploadErrorsInterceptor(policy);
const ctx = {} as ExecutionContext;

async function translate(error: unknown): Promise<unknown> {
  const next: CallHandler = { handle: () => throwError(() => error) };
  try {
    await firstValueFrom(interceptor.intercept(ctx, next));
  } catch (caught) {
    return caught;
  }
  throw new Error('deveria ter falhado');
}

describe('Galeria de fotos — tradução dos erros do upload', () => {
  it('calcula o maior corpo aceito pela política (para o proxy)', () => {
    expect(maxRequestBytes(policy)).toBe(7 * 1024 * 1024);
  });

  it('413 do multer vira mensagem em português com o limite', async () => {
    const error = await translate(
      new PayloadTooLargeException('File too large'),
    );
    expect(error).toBeInstanceOf(PayloadTooLargeException);
    expect((error as Error).message).toBe('Cada foto deve ter no máximo 2 MB');
  });

  it.each(['Too many files', 'Unexpected field'])(
    '"%s" vira limite de fotos',
    async (msg) => {
      const error = (await translate(
        new BadRequestException(msg),
      )) as BadRequestException;
      expect(error.getResponse()).toMatchObject({
        message: ['Envie no máximo 3 fotos, todas no campo "imagens"'],
      });
    },
  );

  it('mantém erros de validação e outros erros intactos', async () => {
    const validation = new BadRequestException(['Informe o nome do produto']);
    expect(await translate(validation)).toBe(validation);
    const notFound = new NotFoundException();
    expect(await translate(notFound)).toBe(notFound);
    const plain = new Error('boom');
    expect(await translate(plain)).toBe(plain);
  });
});
