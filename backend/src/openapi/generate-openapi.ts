import { NestFactory } from '@nestjs/core';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from '../app.module.js';
import { API_PREFIX, createOpenApiDocument } from '../app.setup.js';

/**
 * Valores só para o validador de ambiente do ConfigModule passar. Nada se conecta:
 * o modo preview do Nest não instancia providers, então não há Mongo nem segredo em uso.
 * Variáveis já definidas no ambiente têm prioridade.
 */
const PLACEHOLDER_ENV: Record<string, string> = {
  JWT_SECRET: 'openapi-export-placeholder-jwt-secret-000000',
  PII_HMAC_SECRET: 'openapi-export-placeholder-pii-hmac-secret-0',
  PII_ENCRYPTION_KEY: '0'.repeat(64),
  MONGODB_URI: 'mongodb://localhost:27017/openapi-export',
};

/** Gera o documento OpenAPI sem banco de dados e sem subir servidor. */
export async function generateOpenApiDocument(): Promise<OpenAPIObject> {
  for (const [key, value] of Object.entries(PLACEHOLDER_ENV)) {
    process.env[key] ??= value;
  }

  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });
  try {
    app.setGlobalPrefix(API_PREFIX);
    return createOpenApiDocument(app);
  } finally {
    await app.close();
  }
}
