export const TRAJECTORY_MAX = 2000;
export const ACTIVITIES_MAX = 2000;

// Controle C0 e DEL, exceto tabulação (\t) e quebra de linha (\n), legítimas em texto.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Caractere a partir do código, para a regex abaixo não ter invisíveis no fonte. */
const cp = (codePoint: number) => String.fromCodePoint(codePoint);

/**
 * Invisíveis que não têm uso legítimo no texto do produtor:
 * - controles C1 (U+0080–U+009F);
 * - espaço de largura zero, word joiner e invisíveis matemáticos (U+200B, U+2060–U+2064);
 * - marca de ordem de bytes (U+FEFF);
 * - inversões bidirecionais (U+202A–U+202E, U+2066–U+2069), que permitem
 *   exibir o texto invertido (ex.: um telefone ou link falsificado).
 * O ZWJ/ZWNJ (U+200C/U+200D) ficam: compõem emojis e grafias.
 */
const INVISIBLE_CHARS = new RegExp(
  `[${cp(0x80)}-${cp(0x9f)}${cp(0x200b)}${cp(0x2060)}-${cp(0x2064)}${cp(0xfeff)}` +
    `${cp(0x202a)}-${cp(0x202e)}${cp(0x2066)}-${cp(0x2069)}]`,
  'g',
);

/** Separadores de linha e de parágrafo do Unicode (U+2028, U+2029). */
const UNICODE_LINE_BREAKS = new RegExp(`[${cp(0x2028)}${cp(0x2029)}]`, 'g');

/**
 * Padroniza o texto livre do produtor: quebras de linha em `\n`, sem caracteres
 * de controle nem invisíveis e sem espaços nas pontas (um texto só de
 * invisíveis vira vazio e é recusado como obrigatório). O HTML não é
 * interpretado nem removido: o texto é guardado como veio e quem exibe o escapa.
 * Valores que não são texto passam intactos, para o validador recusá-los.
 */
export function normalizeFreeText<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\r\n?/g, '\n')
    .replace(UNICODE_LINE_BREAKS, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .trim();
}

/** RN07: contato só é público quando o produtor autoriza. */
export function publicPhone(
  telefone: string | undefined,
  autorizado: boolean | undefined,
): string | undefined {
  return autorizado ? telefone : undefined;
}
