import { accentInsensitivePattern } from '../../products/domain/product-search.js';

type TextMatch = { $regex: string; $options: 'i' };

export type ProducerSearchFilter = {
  $or: Array<Record<string, TextMatch>>;
};

/** Campos públicos do produtor em que a busca procura (HU36, RN15). */
const SEARCH_FIELDS = ['nomeIniciativa', 'trajetoria', 'atividades'] as const;

/** HU36: filtro da busca por texto nos produtores; sem termo, não filtra. */
export function buildProducerSearch(
  busca: string | undefined,
): ProducerSearchFilter | undefined {
  const term = busca?.trim();
  if (!term) return undefined;
  const match: TextMatch = {
    $regex: accentInsensitivePattern(term),
    $options: 'i',
  };
  return { $or: SEARCH_FIELDS.map((field) => ({ [field]: match })) };
}
