/**
 * Regras da experiência cadastrada pelo produtor (HU21/RF21, RN09, RN11).
 *
 * Mesmas convenções do produto (HU15): valor guardado em centavos, textos
 * simples, fotos na galeria genérica e dono vindo do token.
 */

/** Tipo da oferta, como o formulário da HU21 apresenta. */
export enum ExperienceCategory {
  EXPERIENCIA = 'Experiência',
}

export const NOME_MAX = 120;
export const DESCRICAO_MAX = 2000;
export const LOCAL_MAX = 300;
/** Mesmo teto de sanidade do preço do produto. */
export const VALOR_MAX = 100_000;
/** Duração máxima aceita: 9999 minutos ou horas (evita erro de digitação gigante). */
export const DURACAO_QTD_MAX = 9999;
// Quantidade e tamanho das fotos: PHOTO_GALLERY_POLICIES.experiencia (common/photos).

/**
 * Duração como o app envia: inteiro positivo + unidade ("1 hora", "90 minutos").
 * A unidade escolhida pelo produtor é mantida, para a oferta aparecer como ele
 * escreveu (CA08, RN11).
 */
const DURACAO = /^(\d{1,4}) (minuto|minutos|hora|horas)$/;

/**
 * Normaliza a duração (espaços, maiúsculas e singular/plural) ou devolve
 * `null` quando não é uma duração válida.
 */
export function normalizeDuracao(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ').toLowerCase();
  const match = DURACAO.exec(text);
  if (!match) return null;
  const qtd = Number(match[1]);
  if (qtd <= 0 || qtd > DURACAO_QTD_MAX) return null;
  const unidade = match[2].startsWith('hora') ? 'hora' : 'minuto';
  return `${qtd} ${unidade}${qtd === 1 ? '' : 's'}`;
}

/**
 * Caminho público de uma foto da experiência, relativo à URL base da API. A
 * versão muda com o conteúdo, o que permite cache permanente (como na HU15).
 */
export function experiencePhotoPath(
  experienceId: string,
  photoId: string,
  versao: string,
): string {
  return `/experiences/${experienceId}/photos/${photoId}?v=${encodeURIComponent(versao)}`;
}
