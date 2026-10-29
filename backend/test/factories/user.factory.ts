import { randomUUID } from 'node:crypto';
import type { CreateConsumerDto } from '../../src/modules/users/dto/create-consumer.dto.js';
import { makeCpf } from './documento.factory.js';

/** Senha que atende à política de cadastro (8+ caracteres, letra e número). */
export const VALID_PASSWORD = 'SenhaForte123';

/** Payload válido de cadastro de consumidor (HU01, RN02, RN15). */
export function makeConsumer(
  overrides: Partial<CreateConsumerDto> = {},
): CreateConsumerDto {
  return {
    nome: 'Maria das Graças',
    cpf: makeCpf(),
    telefone: '61999990000',
    email: `maria.${randomUUID().slice(0, 8)}@exemplo.com`,
    dataNascimento: '1990-05-10',
    senha: VALID_PASSWORD,
    ...overrides,
  };
}
