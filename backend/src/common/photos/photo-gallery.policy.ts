import { PHOTO_MAX_BYTES } from './photo-processing.js';

/**
 * A quem uma galeria de fotos pertence. Cada entidade com várias fotos ganha um
 * valor aqui e uma política abaixo; o armazenamento, o tratamento da imagem, os
 * limites do upload e as mensagens de erro são os mesmos para todas.
 *
 * Para uma galeria nova (ex.: fotos da propriedade):
 * 1. adicione o tipo (ex.: `PROPRIEDADE = 'propriedade'`) e a política;
 * 2. no controller da entidade, use `@PhotoGalleryUpload(PHOTO_GALLERY_POLICIES.propriedade)`;
 * 3. no service, chame `PhotoGalleryService.store/replace/find` com `{ tipo, id }`;
 * 4. se a rota aceitar mais que 1 MB, libere-a no `backend/deploy/Caddyfile`
 *    com `maxRequestBytes(política)`.
 */
export enum PhotoOwnerType {
  PRODUTO = 'produto',
}

export interface PhotoGalleryPolicy {
  /** Nome do campo multipart que leva os arquivos. */
  campo: string;
  /** Mínimo de fotos por envio (0 = opcional). */
  min: number;
  /** Máximo de fotos da galeria. Teto de memória e de corpo da requisição. */
  max: number;
  /** Tamanho máximo de cada arquivo recebido. */
  maxBytesPorFoto: number;
}

export const PHOTO_GALLERY_POLICIES: Record<
  PhotoOwnerType,
  PhotoGalleryPolicy
> = {
  [PhotoOwnerType.PRODUTO]: {
    campo: 'fotos',
    min: 1,
    max: 10,
    maxBytesPorFoto: PHOTO_MAX_BYTES,
  },
};

/** Margem para o envelope multipart e os campos de texto. */
const MULTIPART_MARGIN = 1024 * 1024;

/** Maior corpo de requisição que a política aceita (para o proxy reverso). */
export function maxRequestBytes(policy: PhotoGalleryPolicy): number {
  return policy.max * policy.maxBytesPorFoto + MULTIPART_MARGIN;
}
