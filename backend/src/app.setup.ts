import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { MetricsRegistry } from './modules/metrics/metrics.registry.js';

export const API_PREFIX = 'api/v1';

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
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Rede Cafuringa API')
        .setDescription('API REST da plataforma Rede Cafuringa')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
  }
}
