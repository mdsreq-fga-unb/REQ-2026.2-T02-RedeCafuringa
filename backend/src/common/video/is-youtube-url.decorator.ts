import { Transform } from 'class-transformer';
import { ValidateBy, ValidationOptions } from 'class-validator';
import { extractYoutubeId, VIDEO_URL_ERROR } from './youtube.js';

/** Link de vídeo do YouTube, com a orientação em português (RNF03). */
export function IsYoutubeUrl(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isYoutubeUrl',
      validator: {
        validate: (value: unknown) => extractYoutubeId(value) !== null,
        defaultMessage: () => VIDEO_URL_ERROR,
      },
    },
    options,
  );
}

/**
 * Tira os espaços em volta do link. Formulário que envia o campo em branco
 * equivale a não informar; o que não é texto segue como veio, para o
 * validador recusar.
 */
export function NormalizeVideoUrl(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const text = value.trim();
    return text === '' ? undefined : text;
  });
}
