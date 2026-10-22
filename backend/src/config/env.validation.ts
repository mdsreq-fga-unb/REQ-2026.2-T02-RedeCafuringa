import Joi from 'joi';

/**
 * Valida as variáveis de ambiente na inicialização.
 * A aplicação não sobe se alguma variável obrigatória estiver ausente ou inválida.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
});
