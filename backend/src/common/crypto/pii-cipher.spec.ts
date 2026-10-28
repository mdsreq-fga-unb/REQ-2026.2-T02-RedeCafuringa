import { randomBytes } from 'node:crypto';
import { PiiCipher } from './pii-cipher.js';

const HMAC_SECRET = 'h'.repeat(32);
const ENCRYPTION_KEY = randomBytes(32).toString('hex');

describe('PiiCipher (D1 — CPF como login × LGPD)', () => {
  const cipher = new PiiCipher(HMAC_SECRET, ENCRYPTION_KEY);

  describe('blindIndex', () => {
    it('é determinístico, para permitir a busca no login', () => {
      expect(cipher.blindIndex('52998224725')).toBe(
        cipher.blindIndex('52998224725'),
      );
    });

    it('não contém o valor original', () => {
      const index = cipher.blindIndex('52998224725');

      expect(index).not.toContain('52998224725');
      expect(index).toMatch(/^[0-9a-f]{64}$/);
    });

    it('muda quando o segredo muda', () => {
      const other = new PiiCipher('x'.repeat(32), ENCRYPTION_KEY);

      expect(other.blindIndex('52998224725')).not.toBe(
        cipher.blindIndex('52998224725'),
      );
    });
  });

  describe('encrypt/decrypt', () => {
    it('recupera o valor original', () => {
      expect(cipher.decrypt(cipher.encrypt('52998224725'))).toBe('52998224725');
    });

    it('usa IV aleatório: o mesmo valor gera cifras diferentes', () => {
      expect(cipher.encrypt('52998224725')).not.toBe(
        cipher.encrypt('52998224725'),
      );
    });

    it('rejeita cifra adulterada (autenticação do GCM)', () => {
      const [iv, tag, data] = cipher.encrypt('52998224725').split('.');
      const tampered = Buffer.from(data, 'base64url');
      tampered[0] ^= 1;

      expect(() =>
        cipher.decrypt(`${iv}.${tag}.${tampered.toString('base64url')}`),
      ).toThrow();
    });

    it('rejeita formato inválido', () => {
      expect(() => cipher.decrypt('sem-separadores')).toThrow(
        'Formato de dado cifrado inválido',
      );
    });

    it('não decifra com outra chave', () => {
      const other = new PiiCipher(HMAC_SECRET, randomBytes(32).toString('hex'));

      expect(() => other.decrypt(cipher.encrypt('52998224725'))).toThrow();
    });
  });

  it('exige chave de cifra com 32 bytes em hexadecimal', () => {
    expect(() => new PiiCipher(HMAC_SECRET, 'curta')).toThrow(
      'PII_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais',
    );
  });
});
