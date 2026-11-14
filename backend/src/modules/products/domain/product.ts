/**
 * Regras do produto cadastrado pelo produtor (HU15/RF15, RN09, RN11).
 *
 * Valores monetários são guardados em centavos (inteiro) para nunca somar
 * erro de ponto flutuante; a API expõe reais com até 2 casas, como o front envia.
 */

/** Tipo da oferta, como o formulário da HU15 apresenta. */
export enum ProductCategory {
  PRODUTOS = 'Produtos',
  EXPERIENCIA = 'Experiência',
}

export const NOME_MAX = 120;
export const DESCRICAO_MAX = 2000;
/** Teto de sanidade: evita valores digitados por engano (ex.: 4000000 em vez de 40,00). */
export const PRECO_MAX = 100_000;
/** 1 tonelada por unidade: acima disso é quase certamente erro de digitação. */
export const GRAMAS_MAX = 1_000_000;
// Quantidade e tamanho das fotos: PHOTO_GALLERY_POLICIES.produto (common/photos).

/** Chave enviada no cabeçalho `Idempotency-Key` para reenviar após queda de conexão (CA07). */
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Número decimal escrito com ponto, sem sinal, notação científica ou hexadecimal.
 * `Number()` sozinho aceitaria "1e3", "0x10" e "" (que vira 0).
 */
const DECIMAL = /^\d{1,9}(?:\.\d+)?$/;

/** Converte o texto do multipart em número; o que não for decimal válido vira NaN (e o DTO recusa). */
export function parseDecimal(value: unknown): unknown {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (text === '') return undefined;
  return DECIMAL.test(text) ? Number(text) : Number.NaN;
}

export type AmountProblem = 'invalido' | 'abaixo' | 'acima';

/**
 * Confere um valor numérico do formulário e devolve UM problema (ou null), para
 * o produtor receber uma orientação só, e não "inválido", "abaixo de 0" e
 * "acima do máximo" ao mesmo tempo para um texto que nem é número (RNF03).
 */
export function checkAmount(
  value: unknown,
  {
    min,
    max,
    exclusiveMin = false,
  }: { min: number; max: number; exclusiveMin?: boolean },
): AmountProblem | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalido';
  const cents = value * 100;
  if (Math.abs(cents - Math.round(cents)) > 1e-6) return 'invalido';
  if (exclusiveMin ? value <= min : value < min) return 'abaixo';
  if (value > max) return 'acima';
  return null;
}

export function toCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export function fromCentavos(centavos: number): number {
  return centavos / 100;
}

/**
 * Caminho público de uma foto do produto, relativo à URL base da API. A versão
 * muda com o conteúdo, o que permite cache permanente (mesma estratégia da HU12).
 */
export function productPhotoPath(
  productId: string,
  photoId: string,
  versao: string,
): string {
  return `/products/${productId}/photos/${photoId}?v=${encodeURIComponent(versao)}`;
}
