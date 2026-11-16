import { experiencePhotoPath, normalizeDuracao } from './experience.js';

describe('HU21 — regras da experiência', () => {
  describe('normalizeDuracao', () => {
    it.each([
      ['2 horas', '2 horas'],
      ['1 hora', '1 hora'],
      ['1 horas', '1 hora'],
      ['90 minutos', '90 minutos'],
      ['1 minuto', '1 minuto'],
      ['  3   HORAS ', '3 horas'],
      ['30 minuto', '30 minutos'],
    ])('aceita "%s" como "%s"', (entrada, esperado) => {
      expect(normalizeDuracao(entrada)).toBe(esperado);
    });

    it.each([
      '',
      'duas horas',
      '0 horas',
      '-1 hora',
      '1.5 horas',
      '2',
      'horas',
      '2 dias',
      '10000 minutos',
      '2 horas e meia',
    ])('recusa "%s"', (entrada) => {
      expect(normalizeDuracao(entrada)).toBeNull();
    });

    it('recusa valores que não são texto', () => {
      expect(normalizeDuracao(2)).toBeNull();
      expect(normalizeDuracao(undefined)).toBeNull();
    });
  });

  it('monta o caminho público da foto com a versão escapada', () => {
    expect(experiencePhotoPath('e1', 'f1', 'a+b/c')).toBe(
      '/experiences/e1/photos/f1?v=a%2Bb%2Fc',
    );
  });
});
