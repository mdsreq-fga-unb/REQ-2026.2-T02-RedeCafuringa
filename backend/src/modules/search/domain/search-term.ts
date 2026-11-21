/** Limites do termo da busca de ofertas (HU36, CA08). */
export const MIN_SEARCH_TERM_LENGTH = 2;
export const MAX_SEARCH_TERM_LENGTH = 100;

export type SearchTermFailure = 'VAZIO' | 'CURTO' | 'LONGO' | 'CARACTERES';

export type ParsedSearchTerm =
  | { ok: true; term: string }
  | { ok: false; reason: SearchTermFailure; message: string };

const MESSAGES: Record<SearchTermFailure, string> = {
  VAZIO: 'Informe o que você quer buscar.',
  CURTO: `Digite pelo menos ${MIN_SEARCH_TERM_LENGTH} caracteres para buscar.`,
  LONGO: `A busca deve ter no máximo ${MAX_SEARCH_TERM_LENGTH} caracteres.`,
  CARACTERES:
    'Use apenas letras, números e pontuação simples. Remova símbolos especiais e tente de novo.',
};

const CONTROL_CHARS = /\p{Cc}/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

function fail(reason: SearchTermFailure): ParsedSearchTerm {
  return { ok: false, reason, message: MESSAGES[reason] };
}

/**
 * Valida e normaliza o termo digitado na busca (CA02, CA08): tira os espaços
 * das pontas, junta os repetidos e, se o termo não serve, diz como corrigir.
 */
export function parseSearchTerm(raw: unknown): ParsedSearchTerm {
  if (typeof raw !== 'string') return fail('VAZIO');
  const term = raw.trim().replace(/\s+/g, ' ');
  if (!term) return fail('VAZIO');
  if (term.length > MAX_SEARCH_TERM_LENGTH) return fail('LONGO');
  if (CONTROL_CHARS.test(term)) return fail('CARACTERES');
  if (term.length < MIN_SEARCH_TERM_LENGTH) return fail('CURTO');
  if (!LETTER_OR_DIGIT.test(term)) return fail('CARACTERES');
  return { ok: true, term };
}
