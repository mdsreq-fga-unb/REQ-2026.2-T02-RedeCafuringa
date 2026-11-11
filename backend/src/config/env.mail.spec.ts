import { envValidationSchema } from './env.validation.js';

const base = {
  MONGODB_URI: 'mongodb://localhost:27017/cafuringa',
  JWT_SECRET: 'j'.repeat(32),
  PII_HMAC_SECRET: 'h'.repeat(32),
  PII_ENCRYPTION_KEY: 'a'.repeat(64),
};

const production = {
  ...base,
  NODE_ENV: 'production',
  CORS_ORIGINS: 'https://app.cafuringa.example',
  APP_PUBLIC_URL: 'https://app.cafuringa.example',
  MAIL_TRANSPORT: 'smtp',
  SMTP_HOST: 'smtp.exemplo.com',
  SMTP_USER: 'apikey',
  SMTP_PASSWORD: 'segredo',
};

describe('HU10 — configuração de e-mail e recuperação de acesso', () => {
  it('desenvolvimento: usa padrões seguros sem exigir SMTP', () => {
    const { error, value } = envValidationSchema.validate(base);

    expect(error).toBeUndefined();
    expect(value.MAIL_TRANSPORT).toBe('log');
    expect(value.APP_PUBLIC_URL).toBe('http://localhost:5173');
    expect(value.PASSWORD_RESET_TTL_MINUTES).toBe(30);
    expect(value.PASSWORD_RESET_COOLDOWN_SECONDS).toBe(60);
    expect(value.SMTP_PORT).toBe(587);
    expect(value.MAIL_RETRY_DELAYS_MS).toBe('2000,10000');
  });

  it.each(['0', '500', '1000,5000,30000', ''])(
    'aceita lista de esperas de reenvio "%s"',
    (MAIL_RETRY_DELAYS_MS) => {
      const { error } = envValidationSchema.validate({
        ...base,
        MAIL_RETRY_DELAYS_MS,
      });
      expect(error).toBeUndefined();
    },
  );

  it.each(['abc', '1000,', '-1', '1000;2000', '600001', '1,2,3,4,5,6'])(
    'recusa lista de esperas inválida "%s"',
    (MAIL_RETRY_DELAYS_MS) => {
      const { error } = envValidationSchema.validate({
        ...base,
        MAIL_RETRY_DELAYS_MS,
      });
      expect(error).toBeDefined();
    },
  );

  it('produção: aceita SMTP completo e HTTPS', () => {
    const { error } = envValidationSchema.validate(production);

    expect(error).toBeUndefined();
  });

  it('produção: exige APP_PUBLIC_URL (sem padrão localhost nos links)', () => {
    const { APP_PUBLIC_URL: _omit, ...semUrl } = production;
    const { error } = envValidationSchema.validate(semUrl);

    expect(error).toBeDefined();
  });

  it('produção: recusa o transporte "log" (token apareceria nos logs)', () => {
    const { error } = envValidationSchema.validate({
      ...production,
      MAIL_TRANSPORT: 'log',
    });

    expect(error).toBeDefined();
  });

  it('produção: recusa ausência de MAIL_TRANSPORT', () => {
    const { MAIL_TRANSPORT: _omit, ...semTransporte } = production;
    const { error } = envValidationSchema.validate(semTransporte);

    expect(error).toBeDefined();
  });

  it('produção: recusa APP_PUBLIC_URL em HTTP (RNF10)', () => {
    const { error } = envValidationSchema.validate({
      ...production,
      APP_PUBLIC_URL: 'http://app.cafuringa.example',
    });

    expect(error).toBeDefined();
  });

  it('smtp exige host', () => {
    const { SMTP_HOST: _omit, ...semHost } = production;
    const { error } = envValidationSchema.validate(semHost);

    expect(error).toBeDefined();
  });

  it('smtp exige usuário e senha em par', () => {
    const { SMTP_PASSWORD: _omit, ...semSenha } = production;
    const { error } = envValidationSchema.validate(semSenha);

    expect(error).toBeDefined();
  });

  it.each(['', 'not-a-url', 'javascript:alert(1)', 'ftp://x.com'])(
    'recusa APP_PUBLIC_URL inválida (%s)',
    (url) => {
      const { error } = envValidationSchema.validate({
        ...base,
        APP_PUBLIC_URL: url,
      });

      expect(error).toBeDefined();
    },
  );

  it('recusa APP_PUBLIC_URL com caminho ou query (evita link adulterado)', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      APP_PUBLIC_URL: 'https://app.exemplo.com/x?y=1',
    });

    expect(error).toBeDefined();
  });

  it.each([0, 4, 1441, 'abc'])('recusa TTL fora do intervalo (%s)', (ttl) => {
    const { error } = envValidationSchema.validate({
      ...base,
      PASSWORD_RESET_TTL_MINUTES: ttl,
    });

    expect(error).toBeDefined();
  });

  it('recusa intervalo entre pedidos negativo', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      PASSWORD_RESET_COOLDOWN_SECONDS: -1,
    });

    expect(error).toBeDefined();
  });

  it('aceita remetente com nome', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      MAIL_FROM: 'Rede Cafuringa <nao-responda@cafuringa.example>',
    });

    expect(error).toBeUndefined();
  });
});
