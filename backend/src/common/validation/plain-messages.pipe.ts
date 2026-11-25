import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * `ValidationPipe` que mantém as mensagens de campos aninhados como foram
 * escritas. O padrão do Nest acrescenta o caminho ("pix.Chave Pix inválida…"),
 * e a API promete orientações em português prontas para exibir (RNF03).
 */
export class PlainMessagesValidationPipe extends ValidationPipe {
  protected override prependConstraintsWithParentProp(
    _parentPath: string,
    error: ValidationError,
  ): ValidationError {
    return error;
  }
}
