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

export const API_PREFIX = 'api/v1';

/**
 * Versão do contrato OpenAPI (SemVer), publicada em `info.version` e em
 * shared/openapi.json. Regras de quando subir cada número: docs/shared/contratos.md.
 */
export const OPENAPI_VERSION = '0.1.0';

const OPENAPI_DESCRIPTION = `API REST da plataforma **Rede Cafuringa**.

**Autenticação.** \`POST /auth/login\` troca CPF e senha por um JWT. Envie-o em \`Authorization: Bearer <token>\`. Toda rota exige login, exceto as marcadas como públicas (negação por padrão).

**Rastreabilidade.** Envie \`x-request-id\` (1 a 128 caracteres de \`A-Za-z0-9._-\`). A API devolve o mesmo id no cabeçalho da resposta e nos logs; sem o cabeçalho, ou com valor inválido, gera um UUID.

**Erros.** Todo erro tem o corpo \`ErrorResponse\` (\`statusCode\`, \`message\`, \`error\`). Nas falhas de validação (400), \`message\` é uma lista.

**Limites.** Rotas de login e cadastro têm limite estrito de tentativas por IP; ao exceder, a resposta é 429 com \`Retry-After\` (segundos).

**Dados pessoais.** Respostas nunca trazem hash de senha nem o CPF completo (vem mascarado).

**Versão do contrato.** SemVer, em \`info.version\`. Veja docs/shared/contratos.md.`;

/**
 * Monta o documento OpenAPI da aplicação. Usado pelo Swagger UI (fora de produção) e
 * pela exportação de shared/openapi.json (npm run openapi:export).
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Rede Cafuringa API')
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
          description: 'JWT obtido em POST /auth/login',
        },
        'bearer',
      )
      .addTag('auth', 'Login e dados da sessão (RN08)')
      .addTag('users', 'Cadastro de usuários (RN02, RN15)')
      .addTag('health', 'Saúde do serviço, para o Docker e monitores externos')
      .build(),
    {
      // IDs estáveis e legíveis (authLogin, usersCreateConsumer...), que viram os
      // nomes das operações nos tipos gerados para o front.
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey.replace(/Controller$/, '').toLowerCase()}${
          methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
        }`,
    },
  );
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

  if (config.get<string>('NODE_ENV') !== 'production') {
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, createOpenApiDocument(app));
  }
}
