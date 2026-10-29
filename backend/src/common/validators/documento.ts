/** Remove máscara (pontos, barras, hífens) e normaliza letras para maiúsculas. */
export function onlyDocumentChars(value: string): string {
  return value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
}

/** Calcula os 2 dígitos verificadores a partir dos 9 primeiros dígitos do CPF. */
export function cpfCheckDigits(base: string): string {
  const digits = base.split('').map(Number);
  for (const length of [9, 10]) {
    const sum = digits
      .slice(0, length)
      .reduce((acc, digit, i) => acc + digit * (length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }
  return digits.slice(9).join('');
}

/** Valida CPF pelos dígitos verificadores (RN02, RN08). */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDocumentChars(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  return cpfCheckDigits(cpf.slice(0, 9)) === cpf.slice(9);
}

const CNPJ_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Calcula os 2 dígitos verificadores a partir das 12 primeiras posições do CNPJ.
 * No formato alfanumérico (IN RFB nº 2.229/2024) essas posições aceitam [0-9A-Z]
 * e cada caractere vale seu código ASCII menos 48.
 */
export function cnpjCheckDigits(base: string): string {
  const values = base.split('').map((char) => char.charCodeAt(0) - 48);
  for (const length of [12, 13]) {
    const weights = CNPJ_WEIGHTS.slice(CNPJ_WEIGHTS.length - length);
    const sum = values
      .slice(0, length)
      .reduce((acc, val, i) => acc + val * weights[i], 0);
    const rest = sum % 11;
    values.push(rest < 2 ? 0 : 11 - rest);
  }
  return values.slice(12).join('');
}

/** Valida CNPJ numérico ou alfanumérico (RN03). */
export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDocumentChars(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) {
    return false;
  }
  return cnpjCheckDigits(cnpj.slice(0, 12)) === cnpj.slice(12);
}

/**
 * Mascara o CPF para exibição ao titular (RNF11): só os 6 dígitos centrais
 * ficam visíveis. Valores que não são CPF viram máscara completa.
 */
export function maskCpf(value: string): string {
  const cpf = onlyDocumentChars(value);
  if (!/^\d{11}$/.test(cpf)) return '***.***.***-**';
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}
