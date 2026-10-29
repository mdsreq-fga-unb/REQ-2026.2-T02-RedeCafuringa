import Joi from 'joi';

const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

/**
 * Aceita uma lista separada por vírgula de origens HTTP(S).
 * Rejeita wildcard, vazio, URL inválida e, em produção, HTTP sem TLS.
 */
function validateCorsOrigins(
  value: string,
  helpers: Joi.CustomHelpers,
): string | Joi.ErrorReport {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return helpers.error('any.invalid');
  }

  const ancestors = helpers.state.ancestors as Array<Record<string, unknown>>;
  const isProduction = ancestors[0]?.NODE_ENV === 'production';

  for (const origin of origins) {
    if (origin === '*') {
      return helpers.error('any.invalid');
    }

    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      return helpers.error('any.invalid');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return helpers.error('any.invalid');
    }

    if (isProduction && url.protocol !== 'https:') {
      return helpers.error('any.invalid');
    }
  }

  return value;
}

const corsOriginsSchema = Joi.string().custom(
  validateCorsOrigins,
  'CORS origins',
);

/**
 * Valida as variáveis de ambiente na inicialização.
 * A aplicação não sobe se alguma variável obrigatória estiver ausente ou inválida.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  // Aceita URI pronta (dev/test) ou componentes separados (produção),
  // que são montados com encodeURIComponent para não quebrar com senhas
  // contendo @, :, /, ? ou #.
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .optional(),
  MONGODB_HOST: Joi.string().default('mongo:27017'),
  MONGODB_DB: Joi.string().default('cafuringa'),
  MONGODB_USER: Joi.string().optional(),
  MONGODB_PASSWORD: Joi.string().optional(),
  MONGODB_AUTH_SOURCE: Joi.string().optional(),

  CORS_ORIGINS: Joi.when('NODE_ENV', {
    is: 'production',
    then: corsOriginsSchema.required(),
    otherwise: corsOriginsSchema.default('http://localhost:5173'),
  }),

  TRUST_PROXY: Joi.alternatives()
    .try(Joi.boolean(), Joi.number().integer().min(0).max(10))
    .default(false),
  LOG_LEVEL: Joi.string()
    .valid(...LOG_LEVELS)
    .default('info'),
  THROTTLE_TTL: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
  METRICS_TOKEN: Joi.string().min(16).allow('').optional(),

  // Autenticação (RF09, RNF08). Gere cada segredo com: openssl rand -hex 32
  JWT_SECRET: Joi.string().min(32).required(),
  // Validade do token de acesso, em segundos (padrão 15 min, máximo 24 h).
  JWT_EXPIRES_IN: Joi.number().integer().min(60).max(86_400).default(900),
  // Tentativas de login/cadastro por IP a cada THROTTLE_TTL segundos.
  AUTH_THROTTLE_LIMIT: Joi.number().integer().min(1).default(5),

  // Dados pessoais pesquisáveis (D1, RNF11): blind index e cifra do CPF.
  // Trocar qualquer um deles invalida os CPFs já gravados.
  PII_HMAC_SECRET: Joi.string().min(32).required(),
  PII_ENCRYPTION_KEY: Joi.string()
    .pattern(/^[0-9a-fA-F]{64}$/)
    .required(),
}).custom((value: Record<string, unknown>, helpers: Joi.CustomHelpers) => {
  if (!value.MONGODB_URI && (!value.MONGODB_USER || !value.MONGODB_PASSWORD)) {
    return helpers.error('any.invalid');
  }

  // Segredos com finalidades diferentes não podem ser reaproveitados.
  if (value.JWT_SECRET === value.PII_HMAC_SECRET) {
    return helpers.error('any.invalid');
  }

  return value;
});
