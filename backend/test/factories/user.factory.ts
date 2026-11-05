import { randomUUID } from 'node:crypto';
import type { CreateConsumerDto } from '../../src/modules/users/dto/create-consumer.dto.js';
import type { CreateProducerDto } from '../../src/modules/users/dto/create-producer.dto.js';
import { ProducerCategory } from '../../src/modules/users/domain/producer-category.js';
import { makeCnpj, makeCpf } from './documento.factory.js';

/** Senha que atende à política de cadastro (8+ caracteres, letra e número). */
export const VALID_PASSWORD = 'SenhaForte123';

/** Payload válido de cadastro de consumidor (HU01, RN02, RNF15). */
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

/** Payload válido de cadastro de produtor (HU02, RN02, RNF03). */
export function makeProducer(
  overrides: Partial<CreateProducerDto> = {},
): CreateProducerDto {
  return {
    nomeIniciativa: 'Horta Comunitária Cafuringa',
    nomeResponsavel: 'João da Silva',
    cpf: makeCpf(),
    cnpj: makeCnpj(),
    localidade: 'Fazenda Cafuringa',
    categoriaOfertada: ProducerCategory.PRODUTOS_E_EXPERIENCIAS,
    formasPagamento: ['PIX', 'Dinheiro'],
    email: `joao.${randomUUID().slice(0, 8)}@exemplo.com`,
    senha: VALID_PASSWORD,
    ...overrides,
  };
}
