import { ApiProperty } from '@nestjs/swagger';

/**
 * Corpo de erro padrão da API (formato do Nest). Existe como classe só para entrar
 * no contrato OpenAPI como `ErrorResponse`.
 */
export class ErrorResponse {
  @ApiProperty({ example: 400, description: 'Mesmo valor do status HTTP' })
  statusCode: number;

  @ApiProperty({
    description:
      'Texto do erro. Nas falhas de validação (400) é uma lista, uma mensagem por campo inválido.',
    oneOf: [
      { type: 'string', example: 'Unauthorized' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['CPF inválido', 'Senha é obrigatória'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request', description: 'Nome do status HTTP' })
  error: string;
}

/** Cabeçalho `Retry-After` devolvido nas respostas 429 (limite de tentativas). */
export const RETRY_AFTER_HEADER = {
  'Retry-After': {
    description: 'Segundos até a próxima tentativa ser aceita',
    schema: { type: 'integer', example: 30 },
  },
} as const;
