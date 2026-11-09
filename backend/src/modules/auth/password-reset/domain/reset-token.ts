import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;
const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;

/** Token opaco de 256 bits, em base64url, entregue só ao titular do e-mail (RN05). */
export function generateResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/**
 * O banco guarda apenas o hash: um vazamento da coleção não permite redefinir
 * senhas. SHA-256 basta porque o token já tem 256 bits de entropia.
 */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Confere o formato antes de consultar o banco. Recusa qualquer valor que não
 * seja texto, o que também barra objetos de operador (`{ "$ne": null }`).
 */
export function isResetTokenFormat(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_FORMAT.test(token);
}

export function resetTokenExpiry(now: Date, ttlMinutes: number): Date {
  return new Date(now.getTime() + ttlMinutes * MS_PER_MINUTE);
}

/**
 * Intervalo mínimo entre pedidos da mesma conta (evita bombardear a caixa de
 * entrada de alguém): só um pedido criado até este instante pode ser substituído.
 */
export function cooldownThreshold(now: Date, cooldownSeconds: number): Date {
  return new Date(now.getTime() - cooldownSeconds * MS_PER_SECOND);
}

/**
 * Link do e-mail, no formato da rota por hash do app (`/#/rota?query`, ver
 * app/src/app/useHashRoute.ts). Tudo depois do `#` é fragmento: o navegador não
 * o envia ao servidor nem no cabeçalho `Referer`, então o token não aparece em
 * logs de acesso do front, de CDN ou de proxies.
 */
export function buildResetLink(appPublicUrl: string, token: string): string {
  return `${appPublicUrl}/#/nova-senha?token=${token}`;
}
