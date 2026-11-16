import {
  checkAmount,
  fromCentavos,
  parseDecimal,
  productPhotoPath,
  toCentavos,
} from './product.js';

describe('HU15 — regras do produto', () => {
  describe('parseDecimal', () => {
    it.each([
      ['40', 40],
      ['40.5', 40.5],
      ['0', 0],
      [' 12.34 ', 12.34],
      [7, 7],
    ])('converte %j em %j', (input, expected) => {
      expect(parseDecimal(input)).toBe(expected);
    });

    it('trata texto vazio como ausente (o DTO acusa obrigatório)', () => {
      expect(parseDecimal('')).toBeUndefined();
      expect(parseDecimal('   ')).toBeUndefined();
    });

    it.each(['1e3', '0x10', '-5', '40,00', 'abc', '1.2.3', 'Infinity'])(
      'recusa %j (vira NaN)',
      (input) => {
        expect(parseDecimal(input)).toBeNaN();
      },
    );

    it('mantém outros tipos para o DTO recusar', () => {
      expect(parseDecimal(null)).toBeNull();
      expect(parseDecimal(true)).toBe(true);
    });
  });

  describe('checkAmount', () => {
    const preco = { min: 0, max: 100 };
    const gramas = { min: 0, max: 100, exclusiveMin: true };

    it.each([
      [0, preco, null],
      [40.5, preco, null],
      [100, preco, null],
      [0.01, gramas, null],
      [Number.NaN, preco, 'invalido'],
      [undefined, preco, 'invalido'],
      ['40', preco, 'invalido'],
      [1.999, preco, 'invalido'],
      [Infinity, preco, 'invalido'],
      [-0.5, preco, 'abaixo'],
      [0, gramas, 'abaixo'],
      [100.01, preco, 'acima'],
    ])('%j em %j → %j', (value, range, expected) => {
      expect(checkAmount(value, range)).toBe(expected);
    });
  });

  it('converte reais em centavos sem erro de ponto flutuante', () => {
    expect(toCentavos(0.1 + 0.2)).toBe(30);
    expect(toCentavos(19.99)).toBe(1999);
    expect(fromCentavos(1999)).toBe(19.99);
  });

  it('monta o caminho público da foto com a versão escapada', () => {
    expect(productPhotoPath('p1', 'f1', 'a+b/c')).toBe(
      '/products/p1/photos/f1?v=a%2Bb%2Fc',
    );
  });
});
