import { Transform } from 'class-transformer';
import { ValidateBy, ValidationOptions } from 'class-validator';
import { isValidCnpj, onlyDocumentChars } from './documento.js';

/** Valida CNPJ numérico ou alfanumérico (RF02, RN02). */
export function IsCnpj(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCnpj',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidCnpj(value),
        defaultMessage: () => 'CNPJ inválido',
      },
    },
    options,
  );
}

/**
 * Remove a máscara e normaliza letras antes da validação, mantendo o mesmo
 * formato recebido pelo service e utilizado em índices.
 */
export function NormalizeDocument(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? onlyDocumentChars(value) : value,
  );
}
