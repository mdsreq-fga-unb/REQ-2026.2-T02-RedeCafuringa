import { createHash } from 'node:crypto';
import sharp, { type Metadata, type OutputInfo } from 'sharp';

/**
 * Tratamento de toda foto enviada à plataforma (perfil, produto, propriedade…).
 *
 * O arquivo enviado nunca é guardado como veio: ele é decodificado e
 * regravado. Isso garante três coisas ao mesmo tempo:
 * - privacidade (RNF11/LGPD): EXIF, XMP e principalmente o GPS da foto de
 *   celular, que revelaria a localização da propriedade, são descartados;
 * - segurança: só sai uma imagem WebP válida gerada por nós, nunca um arquivo
 *   arbitrário (SVG com script, poliglota etc.);
 * - conexões lentas (RNF06): a foto publicada fica pequena.
 */

/** Tamanho máximo de cada arquivo enviado. O front reduz a foto antes de enviar. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
/** Teto de pixels da imagem de entrada (≈ câmera de 48 MP), contra bombas de descompressão. */
export const PHOTO_MAX_INPUT_PIXELS = 50_000_000;
/** Maior lado da foto publicada. */
export const PHOTO_MAX_DIMENSION = 960;
/** Menor lado aceito: abaixo disso a foto não serve para divulgação. */
export const PHOTO_MIN_DIMENSION = 64;

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);
const WEBP_QUALITY = 80;

export type InvalidPhotoReason = 'formato' | 'corrompida' | 'dimensao';

const MESSAGES: Record<InvalidPhotoReason, string> = {
  formato: 'Envie uma foto em PNG, JPEG ou WebP.',
  corrompida: 'Não foi possível ler a foto. Tente outro arquivo.',
  dimensao: `A foto deve ter entre ${PHOTO_MIN_DIMENSION} px de lado e ${PHOTO_MAX_INPUT_PIXELS / 1_000_000} megapixels.`,
};

export class InvalidPhotoError extends Error {
  constructor(readonly motivo: InvalidPhotoReason) {
    super(MESSAGES[motivo]);
    this.name = 'InvalidPhotoError';
  }
}

export interface ProcessedPhoto {
  dados: Buffer;
  tipo: 'image/webp';
  largura: number;
  altura: number;
  bytes: number;
  /** Impressão digital do conteúdo; entra na URL para permitir cache permanente. */
  versao: string;
}

export async function processPhoto(input: Buffer): Promise<ProcessedPhoto> {
  // O formato vem dos bytes do arquivo; nome e Content-Type não são confiáveis.
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new InvalidPhotoError('formato');
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new InvalidPhotoError('formato');
  }

  // Confere o cabeçalho antes de decodificar qualquer pixel.
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (
    width * height > PHOTO_MAX_INPUT_PIXELS ||
    Math.min(width, height) < PHOTO_MIN_DIMENSION
  ) {
    throw new InvalidPhotoError('dimensao');
  }

  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await sharp(input, {
      limitInputPixels: PHOTO_MAX_INPUT_PIXELS,
      failOn: 'truncated',
    })
      // Aplica a orientação do EXIF antes de descartá-lo.
      .rotate()
      .resize({
        width: PHOTO_MAX_DIMENSION,
        height: PHOTO_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      // Sem withMetadata(): a saída não leva EXIF, XMP, ICC nem GPS.
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new InvalidPhotoError('corrompida');
  }

  const { data, info } = output;
  return {
    dados: data,
    tipo: 'image/webp',
    largura: info.width,
    altura: info.height,
    bytes: data.length,
    versao: createHash('sha256').update(data).digest('base64url').slice(0, 16),
  };
}
