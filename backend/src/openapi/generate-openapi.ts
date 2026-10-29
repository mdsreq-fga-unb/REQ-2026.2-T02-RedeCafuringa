import { NestFactory } from '@nestjs/core';
import type { OpenAPIObject } from '@nestjs/swagger';
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
  // Obrigatória, e só aceita https, quando NODE_ENV=production (como na imagem Docker).
  CORS_ORIGINS: 'https://openapi-export.example.com',
};

/** Gera o documento OpenAPI sem banco de dados e sem subir servidor. */
export async function generateOpenApiDocument(): Promise<OpenAPIObject> {
  for (const [key, value] of Object.entries(PLACEHOLDER_ENV)) {
    process.env[key] ??= value;
  }

  // Import dinâmico, de propósito: o @Module de AppModule chama ConfigModule.forRoot()
  // (e valida o ambiente) assim que o arquivo é avaliado. Importar no topo rodaria a
  // validação antes de os valores acima existirem e falharia em máquinas sem arquivo
  // de ambiente local, como o CI.
  const { AppModule } = await import('../app.module.js');

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
