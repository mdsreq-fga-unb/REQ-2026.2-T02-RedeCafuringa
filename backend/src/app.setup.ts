import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { MetricsRegistry } from './modules/metrics/metrics.registry.js';
import {
  OPENAPI_DESCRIPTION,
  OPENAPI_TAGS,
  OPENAPI_TITLE,
} from './openapi/openapi-description.js';
import { SWAGGER_UI_OPTIONS } from './openapi/swagger-ui.js';

export const API_PREFIX = 'api/v1';

/**
 * Versão do contrato OpenAPI (SemVer), publicada em `info.version` e em
 * shared/openapi.json. Regras de quando subir cada número: docs/shared/contratos.md.
 */
export const OPENAPI_VERSION = '0.6.0';

/**
 * Monta o documento OpenAPI da aplicação. Usado pelo Swagger UI (fora de produção) e
 * pela exportação de shared/openapi.json (npm run openapi:export).
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const builder = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setDescription(OPENAPI_DESCRIPTION)
    .setVersion(OPENAPI_VERSION)
    .setContact(
      'Equipe Bytelab',
      'https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa',
      '',
    )
    .addServer('http://localhost:3000', 'Desenvolvimento local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Cole o `accessToken` devolvido por POST /auth/login (sem a palavra Bearer).',
      },
      'bearer',
    );
  for (const tag of OPENAPI_TAGS) builder.addTag(tag.name, tag.description);

  return SwaggerModule.createDocument(app, builder.build(), {
    // IDs estáveis e legíveis (authLogin, usersCreateConsumer...), que viram os
    // nomes das operações nos tipos gerados para o front.
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace(/Controller$/, '').toLowerCase()}${
        methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
      }`,
  });
}

/**
 * Configuração global compartilhada entre o bootstrap (main.ts) e os testes e2e,
 * garantindo que os testes exercitem a mesma aplicação que vai para produção.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const httpAdapter = app.getHttpAdapter().getInstance();

  // Atrás do Caddy, confiar em 1 proxy faz req.ip/req.protocol refletirem o
  // cliente real. Sem isso, rate limit e logs enxergam o IP do proxy.
  const trustProxy = config.get<boolean | number>('TRUST_PROXY', false);
  if (trustProxy !== false && trustProxy !== 0) {
    httpAdapter.set('trust proxy', trustProxy === true ? 1 : trustProxy);
  }

  app.useLogger(app.get(Logger));
  app.use(app.get(MetricsRegistry).middleware());
  app.use(helmet());
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGINS', '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    maxAge: 600,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  if (config.get<boolean>('SWAGGER_ENABLED', false)) {
    SwaggerModule.setup(
      `${API_PREFIX}/docs`,
      app,
      createOpenApiDocument(app),
      SWAGGER_UI_OPTIONS,
    );
  }
}
