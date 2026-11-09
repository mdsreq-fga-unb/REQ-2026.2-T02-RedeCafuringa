import {
  ACTIVITIES_MAX,
  normalizeFreeText,
  publicPhone,
  TRAJECTORY_MAX,
} from './trajectory.js';

/**
 * Caracteres invisíveis montados por código (e não escritos literalmente),
 * para o teste continuar legível e o formatador não os trocar por literais.
 */
const ch = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const ZWSP = ch(0x200b); // espaço de largura zero
const BOM = ch(0xfeff);
const WORD_JOINER = ch(0x2060);
const RLO = ch(0x202e); // inverte o texto à direita
const PDF = ch(0x202c);
const LRI = ch(0x2066);
const PDI = ch(0x2069);
const LRE = ch(0x202a);
const LINE_SEP = ch(0x2028);
const PARA_SEP = ch(0x2029);
const ZWJ = ch(0x200d); // compõe emojis

describe('HU12/CA03 — texto livre da trajetória', () => {
  describe('normalizeFreeText', () => {
    it('remove espaços nas pontas', () => {
      expect(normalizeFreeText('  Plantamos café desde 1990.  ')).toBe(
        'Plantamos café desde 1990.',
      );
    });

    it('padroniza quebras de linha para \\n', () => {
      expect(normalizeFreeText('linha 1\r\nlinha 2\rlinha 3')).toBe(
        'linha 1\nlinha 2\nlinha 3',
      );
    });

    it('preserva parágrafos e acentos', () => {
      expect(normalizeFreeText('Minha história\n\nAtuação: horta')).toBe(
        'Minha história\n\nAtuação: horta',
      );
    });

    it('remove caracteres de controle (inclui byte nulo)', () => {
      expect(
        normalizeFreeText(`a${ch(0)}b${ch(7)}c${ch(0x1b)}d${ch(0x7f)}e`),
      ).toBe('abcde');
    });

    it('mantém tabulação e quebra de linha, que são legítimas', () => {
      expect(normalizeFreeText('a\tb\nc')).toBe('a\tb\nc');
    });

    it('texto só de espaços vira vazio', () => {
      expect(normalizeFreeText('   \n\t ')).toBe('');
    });

    it('remove caracteres invisíveis: texto só com eles vira vazio (não publica trajetória em branco)', () => {
      expect(normalizeFreeText(`${ZWSP}${BOM}${WORD_JOINER}`)).toBe('');
    });

    it('remove controles C1 (U+0080 a U+009F)', () => {
      expect(normalizeFreeText(`a${ch(0x85)}b${ch(0x9f)}c`)).toBe('abc');
    });

    it('remove marcas de inversão bidirecional (spoofing de texto, ex.: telefone invertido)', () => {
      expect(normalizeFreeText(`Ligue ${RLO}0000-99999${PDF}`)).toBe(
        'Ligue 0000-99999',
      );
      expect(normalizeFreeText(`a${LRI}b${PDI}c${LRE}d`)).toBe('abcd');
    });

    it('separadores de linha/parágrafo Unicode viram quebra de linha comum', () => {
      expect(normalizeFreeText(`a${LINE_SEP}b${PARA_SEP}c`)).toBe('a\nb\nc');
    });

    it('preserva o ZWJ, que compõe emojis (família, profissões)', () => {
      const familia = `${ch(0x1f468)}${ZWJ}${ch(0x1f469)}${ZWJ}${ch(0x1f467)}`;
      expect(normalizeFreeText(`Somos ${familia}`)).toBe(`Somos ${familia}`);
    });

    it('não interpreta HTML (o texto é guardado como veio; quem exibe escapa)', () => {
      expect(normalizeFreeText('<b>oi</b>')).toBe('<b>oi</b>');
    });

    it('não-texto passa sem alteração, para o validador recusar', () => {
      expect(normalizeFreeText(123 as unknown as string)).toBe(123);
      expect(normalizeFreeText(null as unknown as string)).toBeNull();
    });
  });

  describe('limites', () => {
    it('trajetória e atividades aceitam até 2000 caracteres', () => {
      expect(TRAJECTORY_MAX).toBe(2000);
      expect(ACTIVITIES_MAX).toBe(2000);
    });
  });

  describe('publicPhone (RN07 — contato só quando autorizado)', () => {
    it('devolve o telefone quando o produtor autorizou', () => {
      expect(publicPhone('61999990000', true)).toBe('61999990000');
    });

    it('oculta o telefone quando não autorizado', () => {
      expect(publicPhone('61999990000', false)).toBeUndefined();
    });

    it('oculta quando a autorização não foi definida', () => {
      expect(publicPhone('61999990000', undefined)).toBeUndefined();
    });

    it('sem telefone cadastrado, não há o que mostrar', () => {
      expect(publicPhone(undefined, true)).toBeUndefined();
    });
  });
});
