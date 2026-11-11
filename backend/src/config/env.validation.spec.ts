import { envValidationSchema } from './env.validation.js';

const base = {
  MONGODB_URI: 'mongodb://localhost:27017/cafuringa',
  JWT_SECRET: 'j'.repeat(32),
  PII_HMAC_SECRET: 'h'.repeat(32),
  PII_ENCRYPTION_KEY: 'a'.repeat(64),
};

/** Em produção a HU10 exige e-mail real (SMTP) e a URL pública do app. */
const productionMail = {
  APP_PUBLIC_URL: 'https://example.com',
  MAIL_TRANSPORT: 'smtp',
  SMTP_HOST: 'smtp.example.com',
};

describe('envValidationSchema', () => {
  it('aceita a configuração mínima de desenvolvimento', () => {
    const { error, value } = envValidationSchema.validate(base);

    expect(error).toBeUndefined();
    expect(value.CORS_ORIGINS).toBe('http://localhost:5173');
    expect(value.TRUST_PROXY).toBe(false);
    expect(value.LOG_LEVEL).toBe('info');
    expect(value.JWT_EXPIRES_IN).toBe(900);
    expect(value.AUTH_THROTTLE_LIMIT).toBe(5);
  });

  it('rejeita MONGODB_URI ausente sem componentes de conexão', () => {
    const { error } = envValidationSchema.validate({});

    expect(error).toBeDefined();
  });

  it('aceita componentes de conexão no lugar da URI', () => {
    const { MONGODB_URI: _uri, ...secrets } = base;
    const { error } = envValidationSchema.validate({
      ...secrets,
      MONGODB_USER: 'app',
      MONGODB_PASSWORD: 'secret',
    });

    expect(error).toBeUndefined();
  });

  it('rejeita CORS vazio', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      CORS_ORIGINS: '',
    });

    expect(error).toBeDefined();
  });

  it('rejeita wildcard no CORS', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      CORS_ORIGINS: '*',
    });

    expect(error).toBeDefined();
  });

  it('rejeita origem inválida', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      CORS_ORIGINS: 'not-a-url',
    });

    expect(error).toBeDefined();
  });

  it('em produção exige HTTPS', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'http://example.com',
    });

    expect(error).toBeDefined();
  });

  it('em produção aceita HTTPS', () => {
    const { error } = envValidationSchema.validate({
      ...base,
      ...productionMail,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://example.com',
    });

    expect(error).toBeUndefined();
  });

  describe('SWAGGER_ENABLED', () => {
    it('liga por padrão fora de produção', () => {
      const { value } = envValidationSchema.validate(base);

      expect(value.SWAGGER_ENABLED).toBe(true);
    });

    it('desliga por padrão em produção', () => {
      const { value } = envValidationSchema.validate({
        ...base,
        ...productionMail,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
      });

      expect(value.SWAGGER_ENABLED).toBe(false);
    });

    it('em produção só liga se pedido explicitamente', () => {
      const { value } = envValidationSchema.validate({
        ...base,
        ...productionMail,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
        SWAGGER_ENABLED: 'true',
      });

      expect(value.SWAGGER_ENABLED).toBe(true);
    });
  });

  describe('administrador inicial (HU03)', () => {
    it('é opcional', () => {
      const { error, value } = envValidationSchema.validate(base);

      expect(error).toBeUndefined();
      expect(value.ADMIN_BOOTSTRAP_EMAIL).toBeUndefined();
    });

    it('aceita e-mail e senha forte juntos', () => {
      const { error } = envValidationSchema.validate({
        ...base,
        ADMIN_BOOTSTRAP_EMAIL: 'admin@exemplo.com',
        ADMIN_BOOTSTRAP_SENHA: 'SenhaForte123',
      });

      expect(error).toBeUndefined();
    });

    it('aceita e-mail de domínio interno (.local), como o do .env.example', () => {
      const { error } = envValidationSchema.validate({
        ...base,
        ADMIN_BOOTSTRAP_EMAIL: 'admin@cafuringa.local',
        ADMIN_BOOTSTRAP_SENHA: 'AdminDev123',
      });

      expect(error).toBeUndefined();
    });

    it.each([
      ['só o e-mail', { ADMIN_BOOTSTRAP_EMAIL: 'admin@exemplo.com' }],
      ['só a senha', { ADMIN_BOOTSTRAP_SENHA: 'SenhaForte123' }],
      [
        'e-mail inválido',
        { ADMIN_BOOTSTRAP_EMAIL: 'x', ADMIN_BOOTSTRAP_SENHA: 'SenhaForte123' },
      ],
      [
        'senha fraca',
        {
          ADMIN_BOOTSTRAP_EMAIL: 'admin@exemplo.com',
          ADMIN_BOOTSTRAP_SENHA: 'fraca',
        },
      ],
    ])('rejeita %s', (_caso, extra) => {
      const { error } = envValidationSchema.validate({ ...base, ...extra });

      expect(error).toBeDefined();
    });
  });

  describe('segredos de autenticação e dados pessoais', () => {
    it.each(['JWT_SECRET', 'PII_HMAC_SECRET', 'PII_ENCRYPTION_KEY'])(
      'exige %s',
      (key) => {
        const { error } = envValidationSchema.validate({
          ...base,
          [key]: undefined,
        });

        expect(error).toBeDefined();
      },
    );

    it.each(['JWT_SECRET', 'PII_HMAC_SECRET'])(
      'rejeita %s com menos de 32 caracteres',
      (key) => {
        const { error } = envValidationSchema.validate({
          ...base,
          [key]: 'curto',
        });

        expect(error).toBeDefined();
      },
    );

    it('rejeita PII_ENCRYPTION_KEY que não seja 32 bytes em hexadecimal', () => {
      const { error } = envValidationSchema.validate({
        ...base,
        PII_ENCRYPTION_KEY: 'z'.repeat(64),
      });

      expect(error).toBeDefined();
    });

    it('rejeita o mesmo segredo para JWT e blind index', () => {
      const { error } = envValidationSchema.validate({
        ...base,
        PII_HMAC_SECRET: base.JWT_SECRET,
      });

      expect(error).toBeDefined();
    });

    it('limita a validade do token de acesso a 24 h', () => {
      const { error } = envValidationSchema.validate({
        ...base,
        JWT_EXPIRES_IN: 86_401,
      });

      expect(error).toBeDefined();
    });
  });
});
