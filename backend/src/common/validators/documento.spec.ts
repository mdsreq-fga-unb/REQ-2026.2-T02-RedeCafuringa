import { makeCnpj, makeCpf } from '@test/factories';
import {
  cnpjCheckDigits,
  cpfCheckDigits,
  isValidCnpj,
  isValidCpf,
  onlyDocumentChars,
} from './documento.js';

describe('cpfCheckDigits', () => {
  it('calcula os dígitos verificadores do CPF', () => {
    expect(cpfCheckDigits('529982247')).toBe('25');
  });
});

describe('cnpjCheckDigits', () => {
  it('calcula os dígitos verificadores de CNPJ numérico e alfanumérico', () => {
    expect(cnpjCheckDigits('112223330001')).toBe('81');
    expect(cnpjCheckDigits('12ABC34501DE')).toBe('35');
  });
});

describe('isValidCpf', () => {
  it.each(['529.982.247-25', '52998224725', '111.444.777-35'])(
    'aceita CPF válido %s',
    (cpf) => {
      expect(isValidCpf(cpf)).toBe(true);
    },
  );

  it.each([
    ['dígito verificador errado', '529.982.247-24'],
    ['dígitos repetidos', '111.111.111-11'],
    ['tamanho menor', '5299822472'],
    ['tamanho maior', '529982247251'],
    ['vazio', ''],
    ['com letras', '529.982.24A-25'],
  ])('rejeita CPF com %s', (_, cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it.each(['11.222.333/0001-81', '11222333000181'])(
    'aceita CNPJ numérico válido %s',
    (cnpj) => {
      expect(isValidCnpj(cnpj)).toBe(true);
    },
  );

  // CNPJ alfanumérico (IN RFB nº 2.229/2024), emitido a partir de julho/2026.
  it.each(['12.ABC.345/01DE-35', '12abc34501de35'])(
    'aceita CNPJ alfanumérico válido %s',
    (cnpj) => {
      expect(isValidCnpj(cnpj)).toBe(true);
    },
  );

  it.each([
    ['dígito verificador errado', '11.222.333/0001-82'],
    ['caracteres repetidos', '00.000.000/0000-00'],
    ['letra no dígito verificador', '12.ABC.345/01DE-3A'],
    ['tamanho menor', '1122233300018'],
    ['vazio', ''],
  ])('rejeita CNPJ com %s', (_, cnpj) => {
    expect(isValidCnpj(cnpj)).toBe(false);
  });
});

describe('onlyDocumentChars', () => {
  it('remove pontuação e normaliza para maiúsculas', () => {
    expect(onlyDocumentChars('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });
});

describe('fábricas de documento', () => {
  it('geram CPFs e CNPJs que passam na validação', () => {
    for (let i = 0; i < 100; i++) {
      expect(isValidCpf(makeCpf())).toBe(true);
      expect(isValidCnpj(makeCnpj())).toBe(true);
      expect(isValidCnpj(makeCnpj({ alfanumerico: true }))).toBe(true);
    }
  });
});
