import { Transform } from 'class-transformer';
import { ValidateBy, ValidationOptions } from 'class-validator';
import { isValidCpf, onlyDocumentChars } from './documento.js';

/** Valida CPF pelos dígitos verificadores, com mensagem em português (RNF03). */
export function IsCpf(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCpf',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidCpf(value),
        defaultMessage: () => 'CPF inválido',
      },
    },
    options,
  );
}

/**
 * Remove a máscara do documento antes da validação, para que o service e o
 * blind index sempre recebam o mesmo formato ("529.982.247-25" → "52998224725").
 */
export function NormalizeDocument(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? onlyDocumentChars(value) : value,
  );
}
