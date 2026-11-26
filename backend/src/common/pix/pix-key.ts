/**
 * Chave Pix da produtora (pagamento por Pix). A produtora escolhe o tipo da
 * chave: um celular com DDD tem 11 dígitos, como um CPF, e não dá para saber
 * qual é pelo número. A API guarda a chave normalizada, e nesse formato os
 * tipos não se confundem. As regras são as mesmas do app (features/payments).
 */
import { isValidCnpj, isValidCpf } from '../validators/documento.js';

export const PIX_KEY_TYPES = [
  'cpf',
  'cnpj',
  'telefone',
  'email',
  'aleatoria',
] as const;

export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

/** Limite do campo da chave no código Pix (BR Code, ID 26). */
export const PIX_KEY_MAX = 77;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const digitsOf = (value: string) => value.replace(/\D/g, '');

/** DDD de 11 a 99; celular (11 dígitos) começa com 9 depois do DDD. */
function isNationalPhone(digits: string): boolean {
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (Number(digits.slice(0, 2)) < 11) return false;
  return digits.length === 10 || digits[2] === '9';
}

function phoneKey(text: string): string | null {
  const digits = digitsOf(text);
  let national = digits;
  if (text.startsWith('+') || digits.length > 11) {
    if (!digits.startsWith('55')) return null;
    national = digits.slice(2);
  }
  return isNationalPhone(national) ? `+55${national}` : null;
}

/** Chave no formato guardado pela API, ou null se não for válida. */
export function normalizePixKey(
  tipo: PixKeyType,
  valor: unknown,
): string | null {
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  switch (tipo) {
    case 'cpf': {
      const digits = digitsOf(text);
      return digits.length === 11 && isValidCpf(digits) ? digits : null;
    }
    case 'cnpj': {
      const digits = digitsOf(text);
      return digits.length === 14 && isValidCnpj(digits) ? digits : null;
    }
    case 'telefone':
      return phoneKey(text);
    case 'email': {
      const email = text.toLowerCase();
      return EMAIL.test(email) && email.length <= PIX_KEY_MAX ? email : null;
    }
    case 'aleatoria': {
      const key = text.toLowerCase();
      return UUID.test(key) ? key : null;
    }
    default:
      return null;
  }
}

/** A chave já está no formato da API? */
export function isNormalizedPixKey(chave: string): boolean {
  if (/^\+55\d{10,11}$/.test(chave)) return isNationalPhone(chave.slice(3));
  if (/^\d{11}$/.test(chave)) return isValidCpf(chave);
  if (/^\d{14}$/.test(chave)) return isValidCnpj(chave);
  if (UUID.test(chave)) return true;
  return (
    chave === chave.toLowerCase() &&
    chave.length <= PIX_KEY_MAX &&
    EMAIL.test(chave)
  );
}
