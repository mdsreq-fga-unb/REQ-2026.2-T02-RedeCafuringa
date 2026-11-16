/**
 * Regras da foto de perfil do produtor (RF12).
 *
 * O tratamento da imagem (WebP, sem EXIF/GPS, limites) é o mesmo de toda foto da
 * plataforma e mora em `common/photos/photo-processing.ts`. Aqui ficam só os
 * nomes usados pela HU12 e o caminho público da foto de perfil.
 */
export {
  InvalidPhotoError,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_DIMENSION,
  PHOTO_MAX_INPUT_PIXELS,
  PHOTO_MIN_DIMENSION,
  processPhoto as processProfilePhoto,
  type InvalidPhotoReason,
  type ProcessedPhoto,
} from '../../../common/photos/photo-processing.js';

/**
 * Caminho público da foto, relativo à URL base da API. A versão na URL muda a
 * cada foto nova, o que permite cache permanente no navegador e no proxy.
 */
export function photoPath(producerId: string, versao: string): string {
  return `/producers/${producerId}/photo?v=${encodeURIComponent(versao)}`;
}
