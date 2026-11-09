import {
  buildResetLink,
  cooldownThreshold,
  generateResetToken,
  hashResetToken,
  isResetTokenFormat,
  resetTokenExpiry,
} from './reset-token.js';

describe('HU10/RN05 — token de recuperação de acesso', () => {
  describe('generateResetToken', () => {
    it('gera tokens de 256 bits em base64url (43 caracteres)', () => {
      expect(generateResetToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('nunca repete um token', () => {
      const tokens = new Set(
        Array.from({ length: 200 }, () => generateResetToken()),
      );
      expect(tokens.size).toBe(200);
    });
  });

  describe('hashResetToken', () => {
    it('é determinístico e difere do token original', () => {
      const token = generateResetToken();
      expect(hashResetToken(token)).toBe(hashResetToken(token));
      expect(hashResetToken(token)).not.toContain(token);
    });

    it('produz SHA-256 em hexadecimal (64 caracteres)', () => {
      expect(hashResetToken(generateResetToken())).toMatch(/^[0-9a-f]{64}$/);
    });

    it('tokens diferentes geram hashes diferentes', () => {
      expect(hashResetToken(generateResetToken())).not.toBe(
        hashResetToken(generateResetToken()),
      );
    });
  });

  describe('isResetTokenFormat', () => {
    it('aceita um token gerado pelo sistema', () => {
      expect(isResetTokenFormat(generateResetToken())).toBe(true);
    });

    it.each([
      ['vazio', ''],
      ['curto demais', 'abc'],
      ['longo demais', 'a'.repeat(44)],
      ['com caractere inválido', `${'a'.repeat(42)}!`],
      ['com espaço', `${'a'.repeat(42)} `],
      ['com operador do Mongo', '{"$ne":null}'],
    ])('recusa token %s', (_nome, token) => {
      expect(isResetTokenFormat(token)).toBe(false);
    });

    it('recusa valores que não são texto', () => {
      expect(isResetTokenFormat(undefined)).toBe(false);
      expect(isResetTokenFormat(null)).toBe(false);
      expect(isResetTokenFormat({ $ne: null })).toBe(false);
      expect(isResetTokenFormat(123)).toBe(false);
    });
  });

  describe('resetTokenExpiry', () => {
    it('expira após o TTL informado, em minutos', () => {
      const now = new Date('2026-11-06T12:00:00.000Z');
      expect(resetTokenExpiry(now, 30).toISOString()).toBe(
        '2026-11-06T12:30:00.000Z',
      );
    });

    it('não altera a data recebida', () => {
      const now = new Date('2026-11-06T12:00:00.000Z');
      resetTokenExpiry(now, 30);
      expect(now.toISOString()).toBe('2026-11-06T12:00:00.000Z');
    });
  });

  describe('cooldownThreshold (intervalo mínimo entre pedidos)', () => {
    const now = new Date('2026-11-06T12:00:00.000Z');

    it('só pedidos criados até este instante podem ser substituídos', () => {
      expect(cooldownThreshold(now, 60).toISOString()).toBe(
        '2026-11-06T11:59:00.000Z',
      );
    });

    it('com intervalo 0, qualquer pedido anterior pode ser substituído', () => {
      expect(cooldownThreshold(now, 0).toISOString()).toBe(now.toISOString());
    });
  });

  describe('buildResetLink (token fora da URL enviada ao servidor)', () => {
    const token = generateResetToken();

    it('usa a rota por hash do app (#/nova-senha), com o token dentro do fragmento', () => {
      expect(buildResetLink('https://app.cafuringa.example', token)).toBe(
        `https://app.cafuringa.example/#/nova-senha?token=${token}`,
      );
    });

    it('nada antes do # carrega o token: o navegador não o envia ao servidor nem no Referer', () => {
      const link = buildResetLink('https://app.cafuringa.example', token);
      const [beforeHash] = link.split('#');

      expect(beforeHash).toBe('https://app.cafuringa.example/');
      expect(beforeHash).not.toContain(token);
    });
  });
});
