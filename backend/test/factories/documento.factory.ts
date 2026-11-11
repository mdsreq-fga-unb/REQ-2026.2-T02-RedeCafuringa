import {
  cnpjCheckDigits,
  cpfCheckDigits,
} from '../../src/common/validators/documento.js';

const DIGITS = '0123456789';
const ALPHANUMERIC = DIGITS + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomChars(alphabet: string, length: number): string {
  return Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('');
}

/** Gera um CPF válido, sem máscara. */
export function makeCpf(): string {
  let base: string;
  do {
    base = randomChars(DIGITS, 9);
  } while (/^(\d)\1{8}$/.test(base));
  return base + cpfCheckDigits(base);
}

/** Gera um CNPJ válido, sem máscara. Numérico por padrão. */
export function makeCnpj({ alfanumerico = false } = {}): string {
  let base: string;
  do {
    base = randomChars(alfanumerico ? ALPHANUMERIC : DIGITS, 12);
  } while (/^(.)\1{11}$/.test(base));
  return base + cnpjCheckDigits(base);
}
