import {
  MAX_SEARCH_TERM_LENGTH,
  MIN_SEARCH_TERM_LENGTH,
  parseSearchTerm,
} from './search-term.js';

describe('HU36 — termo da busca de ofertas (CA02, CA08)', () => {
  describe('termo válido (CA02)', () => {
    it('devolve o termo sem espaços nas pontas', () => {
      expect(parseSearchTerm('  cafe  ')).toEqual({ ok: true, term: 'cafe' });
    });

    it('junta espaços repetidos no meio do termo', () => {
      expect(parseSearchTerm('queijo   minas\tmeia')).toEqual({
        ok: true,
        term: 'queijo minas meia',
      });
    });

    it('aceita acentos, números e pontuação comum', () => {
      expect(parseSearchTerm('Pão de mel (500 g)')).toEqual({
        ok: true,
        term: 'Pão de mel (500 g)',
      });
    });

    it('aceita o termo com exatamente o tamanho mínimo e o máximo', () => {
      expect(parseSearchTerm('ab').ok).toBe(true);
      expect(parseSearchTerm('a'.repeat(MAX_SEARCH_TERM_LENGTH)).ok).toBe(true);
    });
  });

  describe('termo inválido (CA08): explica como corrigir', () => {
    it.each([
      ['ausente', undefined],
      ['vazio', ''],
      ['só espaços', '   \t '],
    ])('%s pede que o usuário informe um termo', (_caso, valor) => {
      expect(parseSearchTerm(valor)).toEqual({
        ok: false,
        reason: 'VAZIO',
        message: 'Informe o que você quer buscar.',
      });
    });

    it('curto demais pede mais caracteres', () => {
      expect(MIN_SEARCH_TERM_LENGTH).toBe(2);
      expect(parseSearchTerm(' a ')).toEqual({
        ok: false,
        reason: 'CURTO',
        message: `Digite pelo menos ${MIN_SEARCH_TERM_LENGTH} caracteres para buscar.`,
      });
    });

    it('longo demais informa o limite', () => {
      expect(parseSearchTerm('a'.repeat(MAX_SEARCH_TERM_LENGTH + 1))).toEqual({
        ok: false,
        reason: 'LONGO',
        message: `A busca deve ter no máximo ${MAX_SEARCH_TERM_LENGTH} caracteres.`,
      });
    });

    it('mede o tamanho depois de tirar espaços sobrando', () => {
      const comEspacos = `  ${'a'.repeat(MAX_SEARCH_TERM_LENGTH)}  `;
      expect(parseSearchTerm(comEspacos).ok).toBe(true);
    });

    it.each([
      ['caractere de controle', 'caf\u0000e'],
      ['quebra de linha dentro do termo e símbolos soltos', '%%% \n ***'],
    ])('%s é recusado com orientação', (_caso, valor) => {
      expect(parseSearchTerm(valor)).toMatchObject({
        ok: false,
        reason: 'CARACTERES',
        message:
          'Use apenas letras, números e pontuação simples. Remova símbolos especiais e tente de novo.',
      });
    });

    it.each(['%%%', '***', '--', '(  )', '...'])(
      '%j não tem letra nem número e é recusado',
      (valor) => {
        expect(parseSearchTerm(valor)).toMatchObject({
          ok: false,
          reason: 'CARACTERES',
        });
      },
    );

    it('não é texto: recusa como termo vazio', () => {
      expect(parseSearchTerm(123 as unknown as string)).toMatchObject({
        ok: false,
        reason: 'VAZIO',
      });
    });
  });
});
