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
 * Origem pública do app (HU10): base dos links enviados por e-mail. Aceita só
 * esquema + host, sem caminho, query ou fragmento, para o link não ser adulterado
 * por configuração; em produção exige HTTPS (RNF10).
 */
function validateAppPublicUrl(
  value: string,
  helpers: Joi.CustomHelpers,
): string | Joi.ErrorReport {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return helpers.error('any.invalid');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return helpers.error('any.invalid');
  }
  if (url.pathname !== '/' || url.search || url.hash || url.username) {
    return helpers.error('any.invalid');
  }

  const ancestors = helpers.state.ancestors as Array<Record<string, unknown>>;
  if (ancestors[0]?.NODE_ENV === 'production' && url.protocol !== 'https:') {
    return helpers.error('any.invalid');
  }

  return url.origin;
}

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

  // Swagger UI em /api/v1/docs. Ligado por padrão fora de produção; em produção
  // só com SWAGGER_ENABLED=true (e o Caddy exige basic auth, ver deploy/Caddyfile).
  SWAGGER_ENABLED: Joi.boolean().when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().default(false),
    otherwise: Joi.boolean().default(true),
  }),

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

  // Primeiro administrador (HU03). Opcionais, mas sempre em par; a senha segue
  // a política do cadastro (8+ caracteres, com letra e número).
  ADMIN_BOOTSTRAP_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .empty(''),
  ADMIN_BOOTSTRAP_SENHA: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Za-z]/)
    .pattern(/\d/)
    .empty(''),

  // Recuperação de acesso (HU10, RF10, RN05).
  // Origem do app: os links de redefinição enviados por e-mail apontam para ela.
  APP_PUBLIC_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .custom(validateAppPublicUrl, 'APP_PUBLIC_URL')
      .required(),
    otherwise: Joi.string()
      .custom(validateAppPublicUrl, 'APP_PUBLIC_URL')
      .default('http://localhost:5173'),
  }),
  // "log" só escreve o e-mail no log (dev/test); "smtp" envia de verdade.
  // Em produção só "smtp": o log exibiria o token de redefinição.
  MAIL_TRANSPORT: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.valid('smtp').required(),
    otherwise: Joi.valid('log', 'smtp').default('log'),
  }),
  MAIL_FROM: Joi.string()
    .max(254)
    .pattern(/^[^\r\n]+$/)
    .default('Rede Cafuringa <nao-responda@cafuringa.local>'),
  SMTP_HOST: Joi.string()
    .hostname()
    .empty('')
    .when('MAIL_TRANSPORT', { is: 'smtp', then: Joi.required() }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().empty(''),
  SMTP_PASSWORD: Joi.string().empty(''),
  // Esperas (ms) entre as novas tentativas de envio após uma falha do SMTP.
  // Até 5 valores, cada um até 10 min; vazio desliga o reenvio.
  MAIL_RETRY_DELAYS_MS: Joi.string()
    .allow('')
    .pattern(/^\d{1,6}(,\d{1,6}){0,4}$/)
    .custom((value: string, helpers: Joi.CustomHelpers) =>
      value.split(',').some((part) => Number(part) > 600_000)
        ? helpers.error('any.invalid')
        : value,
    )
    .default('2000,10000'),
  // Validade do link de redefinição, em minutos (5 min a 24 h).
  PASSWORD_RESET_TTL_MINUTES: Joi.number()
    .integer()
    .min(5)
    .max(1440)
    .default(30),
  // Intervalo mínimo entre dois pedidos para a mesma conta, em segundos.
  PASSWORD_RESET_COOLDOWN_SECONDS: Joi.number()
    .integer()
    .min(0)
    .max(3600)
    .default(60),
})
  .and('ADMIN_BOOTSTRAP_EMAIL', 'ADMIN_BOOTSTRAP_SENHA')
  .and('SMTP_USER', 'SMTP_PASSWORD')
  .custom((value: Record<string, unknown>, helpers: Joi.CustomHelpers) => {
    if (
      !value.MONGODB_URI &&
      (!value.MONGODB_USER || !value.MONGODB_PASSWORD)
    ) {
      return helpers.error('any.invalid');
    }

    // Segredos com finalidades diferentes não podem ser reaproveitados.
    if (value.JWT_SECRET === value.PII_HMAC_SECRET) {
      return helpers.error('any.invalid');
    }

    return value;
  });
