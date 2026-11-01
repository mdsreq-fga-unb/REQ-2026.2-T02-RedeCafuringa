import { describe, expect, it } from 'vitest';
import { isValidCnpj } from '@/features/register/validators';

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