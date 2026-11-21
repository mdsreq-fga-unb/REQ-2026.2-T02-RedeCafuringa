/** Limites do termo da busca de ofertas (HU36, CA08); iguais aos do back. */
export const MIN_SEARCH_TERM_LENGTH = 2;
export const MAX_SEARCH_TERM_LENGTH = 100;

export type SearchTermFailure = "VAZIO" | "CURTO" | "LONGO" | "CARACTERES";

export type ValidatedSearchTerm =
    | { ok: true; term: string }
    | { ok: false; reason: SearchTermFailure; message: string };

const MESSAGES: Record<SearchTermFailure, string> = {
    VAZIO: "Informe o que você quer buscar.",
    CURTO: `Digite pelo menos ${MIN_SEARCH_TERM_LENGTH} caracteres para buscar.`,
    LONGO: `A busca deve ter no máximo ${MAX_SEARCH_TERM_LENGTH} caracteres.`,
    CARACTERES:
        "Use apenas letras, números e pontuação simples. Remova símbolos especiais e tente de novo.",
};

const CONTROL_CHARS = /\p{Cc}/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

function fail(reason: SearchTermFailure): ValidatedSearchTerm {
    return { ok: false, reason, message: MESSAGES[reason] };
}

/** Tira os espaços das pontas e junta os repetidos no meio do termo. */
export function normalizeSearchTerm(raw: string): string {
    return raw.trim().replace(/\s+/g, " ");
}

/**
 * Valida o termo digitado antes de buscar (CA02, CA08). Mesmas regras do back,
 * para o usuário ser orientado sem esperar a rede (RNF03, RNF06).
 */
export function validateSearchTerm(raw: string): ValidatedSearchTerm {
    const term = normalizeSearchTerm(raw);
    if (!term) return fail("VAZIO");
    if (term.length > MAX_SEARCH_TERM_LENGTH) return fail("LONGO");
    if (CONTROL_CHARS.test(term)) return fail("CARACTERES");
    if (term.length < MIN_SEARCH_TERM_LENGTH) return fail("CURTO");
    if (!LETTER_OR_DIGIT.test(term)) return fail("CARACTERES");
    return { ok: true, term };
}
