import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

/**
 * Proteção de dados pessoais pesquisáveis, como o CPF usado no login (D1, RNF11).
 *
 * - `blindIndex`: HMAC-SHA256 determinístico, usado na busca e no índice único.
 * - `encrypt`/`decrypt`: AES-256-GCM com IV aleatório, para exibir o dado só
 *   ao titular ou ao administrador. Formato: `iv.tag.cifra` em base64url.
 */
export class PiiCipher {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly hmacSecret: string,
    encryptionKeyHex: string,
  ) {
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKeyHex)) {
      throw new Error('PII_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais');
    }
    this.encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
  }

  blindIndex(value: string): string {
    return createHmac('sha256', this.hmacSecret).update(value).digest('hex');
  }

  encrypt(value: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

    return [iv, cipher.getAuthTag(), data]
      .map((part) => part.toString('base64url'))
      .join('.');
  }

  decrypt(payload: string): string {
    const parts = payload.split('.');
    if (parts.length !== 3) {
      throw new Error('Formato de dado cifrado inválido');
    }

    const [iv, tag, data] = parts.map((part) => Buffer.from(part, 'base64url'));
    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8',
    );
  }
}
