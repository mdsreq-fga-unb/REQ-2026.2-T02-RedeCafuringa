import {
  accentInsensitivePattern,
  buildProductSearch,
} from './product-search.js';

const matches = (busca: string, text: string) =>
  new RegExp(accentInsensitivePattern(busca), 'i').test(text);

describe('HU19 — busca no catálogo de produtos (RN15)', () => {
  describe('accentInsensitivePattern', () => {
    it.each([
      ['cafe', 'Café torrado'],
      ['Café', 'CAFE TORRADO'],
      ['acucar', 'Açúcar mascavo'],
      ['pao', 'Pão caseiro'],
      ['horta', 'Horta da Joana'],
    ])('%j encontra %j, ignorando acentos e maiúsculas', (busca, text) => {
      expect(matches(busca, text)).toBe(true);
    });

    it('não encontra o que não contém o termo', () => {
      expect(matches('mel', 'Queijo minas')).toBe(false);
    });

    it('trata o termo como texto literal (sem regex injetada)', () => {
      expect(matches('.*', 'Queijo minas')).toBe(false);
      expect(matches('(1+1)', 'Kit (1+1) de mudas')).toBe(true);
    });
  });

  describe('buildProductSearch', () => {
    it('sem termo (ausente ou só espaços) não filtra', () => {
      expect(buildProductSearch(undefined)).toBeUndefined();
      expect(buildProductSearch('   ')).toBeUndefined();
    });

    it('procura no nome do produto e no nome da iniciativa do produtor', () => {
      const pattern = accentInsensitivePattern('cafe');
      expect(buildProductSearch('  cafe ')).toEqual({
        $or: [
          { nome: { $regex: pattern, $options: 'i' } },
          { 'responsavel.nomeIniciativa': { $regex: pattern, $options: 'i' } },
        ],
      });
    });
  });
});
