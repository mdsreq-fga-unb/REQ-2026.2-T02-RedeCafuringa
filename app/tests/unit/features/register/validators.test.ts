import { describe, expect, it } from 'vitest';
import { formatCnpj, isValidCnpj } from '@/features/register/validators';

describe('formatCnpj', () => {
  it('aplica a máscara 00.000.000/0000-00', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formata progressivamente enquanto o usuário digita', () => {
    expect(formatCnpj('1122')).toBe('11.22');
  });

  it('ignora o que não é dígito e corta acima de 14 dígitos', () => {
    expect(formatCnpj('11.222.333/0001-81999')).toBe('11.222.333/0001-81');
  });
});

describe('isValidCnpj', () => {
  it('aceita um CNPJ válido, com ou sem máscara', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com dígito verificador errado', () => {
  expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
});

it('rejeita CNPJ com todos os dígitos iguais', () => {
  expect(isValidCnpj('00.000.000/0000-00')).toBe(false);
});

it('rejeita CNPJ com mais de 14 dígitos', () => {
  expect(isValidCnpj('11.222.333/0001-81 9')).toBe(false);
});
});