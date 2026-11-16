import { escapeRegex } from '../../users/domain/user-filter.js';

type TextMatch = { $regex: string; $options: 'i' };

export type ProductSearchFilter = {
  $or: Array<Record<string, TextMatch>>;
};

/**
 * Campos em que a busca do catálogo procura (HU19, RN15). `responsavel` é o
 * produtor trazido pelo `$lookup` da listagem.
 */
const SEARCH_FIELDS = ['nome', 'responsavel.nomeIniciativa'] as const;

/** Variantes acentuadas de cada letra, para "cafe" encontrar "Café". */
const ACCENTS: Record<string, string> = {
  a: '[aáàâãä]',
  e: '[eéèêë]',
  i: '[iíìîï]',
  o: '[oóòôõö]',
  u: '[uúùûü]',
  c: '[cç]',
  n: '[nñ]',
};

/** Remove os acentos do termo ("Café" vira "Cafe"). */
function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Padrão literal do termo que ignora acentos (sem regex injetada). Maiúsculas
 * ficam por conta da opção `i`.
 */
export function accentInsensitivePattern(term: string): string {
  return escapeRegex(stripAccents(term))
    .split('')
    .map((char) => ACCENTS[char.toLowerCase()] ?? char)
    .join('');
}

/** HU19: filtro da busca por texto no catálogo; sem termo, não filtra. */
export function buildProductSearch(
  busca: string | undefined,
): ProductSearchFilter | undefined {
  const term = busca?.trim();
  if (!term) return undefined;
  const match: TextMatch = {
    $regex: accentInsensitivePattern(term),
    $options: 'i',
  };
  return { $or: SEARCH_FIELDS.map((field) => ({ [field]: match })) };
}
