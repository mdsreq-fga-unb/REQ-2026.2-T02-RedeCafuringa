import { envValidationSchema } from './env.validation.js';

const base = {
  MONGODB_URI: 'mongodb://localhost:27017/cafuringa',
};

describe('envValidationSchema', () => {
  it('aceita a configuração mínima de desenvolvimento', () => {
    const { error, value } = envValidationSchema.validate(base);

    expect(error).toBeUndefined();
    expect(value.CORS_ORIGINS).toBe('http://localhost:5173');
    expect(value.TRUST_PROXY).toBe(false);
    expect(value.LOG_LEVEL).toBe('info');
  });

  it('rejeita MONGODB_URI ausente sem componentes de conexão', () => {
    const { error } = envValidationSchema.validate({});

    expect(error).toBeDefined();
  });

  it('aceita componentes de conexão no lugar da URI', () => {
    const { error } = envValidationSchema.validate({
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
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://example.com',
    });

    expect(error).toBeUndefined();
  });
});
