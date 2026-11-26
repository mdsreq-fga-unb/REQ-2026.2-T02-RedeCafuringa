import {
  PIX_KEY_TYPES,
  PixKeyType,
  isNormalizedPixKey,
  normalizePixKey,
} from './pix-key.js';

describe('chave Pix — tipos', () => {
  it('são os cinco tipos do Pix', () => {
    expect([...PIX_KEY_TYPES].sort()).toEqual(
      ['aleatoria', 'cnpj', 'cpf', 'email', 'telefone'].sort(),
    );
  });
});

describe('chave Pix — normalizePixKey', () => {
  it.each<[PixKeyType, string, string]>([
    ['telefone', '(61) 99999-8888', '+5561999998888'],
    ['telefone', '61 3333-4444', '+556133334444'],
    ['telefone', '+55 61 99999-8888', '+5561999998888'],
    ['cpf', '529.982.247-25', '52998224725'],
    ['cnpj', '11.222.333/0001-81', '11222333000181'],
    ['email', '  Maria@Exemplo.COM ', 'maria@exemplo.com'],
    [
      'aleatoria',
      '123E4567-E89B-12D3-A456-426614174000',
      '123e4567-e89b-12d3-a456-426614174000',
    ],
  ])('%s %s vira %s', (tipo, valor, esperado) => {
    expect(normalizePixKey(tipo, valor)).toBe(esperado);
  });

  it.each<[PixKeyType, unknown]>([
    ['telefone', ''],
    ['telefone', '999'],
    ['telefone', '+1 202 555 0100'],
    ['telefone', '(05) 99999-8888'],
    ['cpf', '529.982.247-26'],
    ['cpf', '11111111111'],
    ['cnpj', '11.222.333/0001-82'],
    ['email', 'maria@'],
    ['email', 'maria exemplo@x.com'],
    ['email', `${'a'.repeat(70)}@exemplo.com`],
    ['aleatoria', '123e4567-e89b-12d3-a456'],
    ['cpf', 52998224725],
    ['email', null],
  ])('recusa %s %j', (tipo, valor) => {
    expect(normalizePixKey(tipo, valor)).toBeNull();
  });

  it('tipo desconhecido não tem chave', () => {
    expect(normalizePixKey('boleto' as PixKeyType, '123')).toBeNull();
  });
});

describe('chave Pix — isNormalizedPixKey', () => {
  it.each([
    '+5561999998888',
    '52998224725',
    '11222333000181',
    'maria@exemplo.com',
    '123e4567-e89b-12d3-a456-426614174000',
  ])('aceita %s', (chave) => {
    expect(isNormalizedPixKey(chave)).toBe(true);
  });

  it.each([
    '',
    '(61) 99999-8888',
    '529.982.247-25',
    'Maria@Exemplo.com',
    'abc',
  ])('recusa %j', (chave) => {
    expect(isNormalizedPixKey(chave)).toBe(false);
  });
});
