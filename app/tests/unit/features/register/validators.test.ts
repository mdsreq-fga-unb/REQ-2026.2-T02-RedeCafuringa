import { describe, expect, it } from 'vitest';
import { formatCnpj, isValidCnpj, isValidPhone, formatPhone, isValidEmail, isValidPassword, passwordsMatch } from '@/features/register/validators';

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

describe('isValidPhone', () => {
  it('aceita celular (11 dígitos) e fixo (10 dígitos) com DDD, com ou sem máscara', () => {
    expect(isValidPhone('(61) 91234-5678')).toBe(true);
    expect(isValidPhone('61912345678')).toBe(true);
    expect(isValidPhone('(61) 3333-4444')).toBe(true);
  });
    it('rejeita telefone com menos de 10 ou mais de 11 dígitos', () => {
    expect(isValidPhone('(61) 3333-444')).toBe(false);
    expect(isValidPhone('619123456789')).toBe(false);
  });

  it('rejeita DDD inválido', () => {
    expect(isValidPhone('(05) 91234-5678')).toBe(false);
    expect(isValidPhone('(10) 3333-4444')).toBe(false);
  });

  it('rejeita celular de 11 dígitos que não começa com 9 depois do DDD', () => {
    expect(isValidPhone('(61) 81234-5678')).toBe(false);
  });
});

describe('formatPhone', () => {
  it('formata fixo (10 dígitos) como (00) 0000-0000', () => {
    expect(formatPhone('6133334444')).toBe('(61) 3333-4444');
  });

  it('formata celular (11 dígitos) como (00) 00000-0000', () => {
    expect(formatPhone('61912345678')).toBe('(61) 91234-5678');
  });

  it('formata progressivamente enquanto o usuário digita', () => {
    expect(formatPhone('6')).toBe('(6');
    expect(formatPhone('61')).toBe('(61');
    expect(formatPhone('619')).toBe('(61) 9');
  });

  it('ignora o que não é dígito e corta acima de 11 dígitos', () => {
    expect(formatPhone('(61) 91234-5678 99')).toBe('(61) 91234-5678');
  });
});

describe('isValidEmail', () => {
  it('aceita e-mails com formato válido', () => {
    expect(isValidEmail('raizes@exemplo.com')).toBe(true);
    expect(isValidEmail('ana.silva+loja@dominio.com.br')).toBe(true);
  });
    it('rejeita e-mail sem @, sem usuário ou sem domínio', () => {
    expect(isValidEmail('raizes.exemplo.com')).toBe(false);
    expect(isValidEmail('@exemplo.com')).toBe(false);
    expect(isValidEmail('raizes@')).toBe(false);
  });

  it('rejeita e-mail sem ponto no domínio ou com espaços', () => {
    expect(isValidEmail('raizes@exemplo')).toBe(false);
    expect(isValidEmail('raizes@exemplo.')).toBe(false);
    expect(isValidEmail('rai zes@exemplo.com')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('aceita senha com 8 ou mais caracteres', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('uma-senha-bem-longa')).toBe(true);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});

describe('passwordsMatch', () => {
  it('aceita quando a confirmação é idêntica à senha', () => {
    expect(passwordsMatch('senha-segura-1', 'senha-segura-1')).toBe(true);
  });

  it('rejeita confirmação diferente, inclusive só na caixa das letras', () => {
    expect(passwordsMatch('senha-segura-1', 'senha-segura-2')).toBe(false);
    expect(passwordsMatch('Senha-Segura', 'senha-segura')).toBe(false);
  });
});
