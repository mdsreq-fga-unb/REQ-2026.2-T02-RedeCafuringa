import { describe, expect, it } from 'vitest';
import type { RegisterPayload } from '@/features/register/registerForm';
import { toCreateProducerBody } from '@/features/register/registerApi';

const payload: RegisterPayload = {
  nature: 'producer',
  name: 'Maria da Silva',
  document: '52998224725',
  phone: '61912345678',
  email: 'maria@exemplo.com',
  address: 'Chácara 12, Núcleo Rural, Brasília - DF',
  password: 'senha-segura-1',
  isAdult: true,
};

describe('toCreateProducerBody', () => {
  it('traduz o payload para o corpo da API em português, usando cpf', () => {
    expect(toCreateProducerBody(payload)).toEqual({
      natureza: 'PRODUTOR',
      nome: 'Maria da Silva',
      cpf: '52998224725',
      telefone: '61912345678',
      email: 'maria@exemplo.com',
      endereco: 'Chácara 12, Núcleo Rural, Brasília - DF',
      senha: 'senha-segura-1',
      maiorDeIdade: true,
    });
  });

  it('usa cnpj, e não cpf, quando o documento tem 14 dígitos', () => {
    const body = toCreateProducerBody({ ...payload, document: '11222333000181' });
    expect(body.cnpj).toBe('11222333000181');
    expect(body).not.toHaveProperty('cpf');
  });

  it.each([
    ['producer', 'PRODUTOR'],
    ['property', 'PROPRIEDADE'],
    ['association', 'ASSOCIACAO'],
    ['community', 'COMUNIDADE'],
  ] as const)('converte a natureza %s para %s', (nature, expected) => {
    expect(toCreateProducerBody({ ...payload, nature }).natureza).toBe(expected);
  });
});