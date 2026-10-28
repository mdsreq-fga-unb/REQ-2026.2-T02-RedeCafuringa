import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { envValidationSchema } from './config/env.validation.js';
import { resolveMongoUri } from './config/mongo-uri.js';
import { AuthModule } from './modules/auth/auth.module.js';
import {
  AUTH_THROTTLER,
  isNotAuthThrottled,
} from './modules/auth/decorators/auth-throttle.decorator.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';
import { HealthModule } from './modules/health/health.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          base: {
            service: 'rede-cafuringa-api',
            env: config.get<string>('NODE_ENV', 'development'),
          },
          timestamp: pino.stdTimeFunctions.isoTime,
          genReqId: (req, res) => {
            const header = req.headers['x-request-id'];
            const candidate = Array.isArray(header) ? header[0] : header;
            const requestId =
              candidate && /^[A-Za-z0-9._-]{1,128}$/.test(candidate)
                ? candidate
                : randomUUID();

            res.setHeader('x-request-id', requestId);
            return requestId;
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'req.body.password',
              'req.body.cpf',
              'req.body.email',
              'req.query.cpf',
              'req.query.email',
              'req.query.token',
              'req.query.password',
            ],
            censor: '[REDACTED]',
          },
          // Log compacto e sem query string (evita PII em URL/query).
          serializers: {
            req: (req: {
              id?: string;
              method?: string;
              url?: string;
              remoteAddress?: string;
            }) => ({
              id: req.id,
              method: req.method,
              url:
                typeof req.url === 'string' ? req.url.split('?')[0] : req.url,
              remoteAddress: req.remoteAddress,
            }),
            res: (res: { statusCode?: number }) => ({
              statusCode: res.statusCode,
            }),
          },
          autoLogging: {
            ignore: (req) =>
              typeof req.url === 'string' &&
              req.url.startsWith('/api/v1/health'),
          },
          customLogLevel: (_req, res, err) => {
            if (err || res.statusCode >= 500) {
              return 'error';
            }
            if (res.statusCode >= 400) {
              return 'warn';
            }
            return 'info';
          },
        },
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            // A configuração é em segundos; o throttler espera milissegundos.
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
          {
            // Limite extra, mais restrito, só nas rotas com @AuthThrottle().
            name: AUTH_THROTTLER,
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('AUTH_THROTTLE_LIMIT', 5),
            skipIf: isNotAuthThrottled,
          },
        ],
      }),
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: resolveMongoUri(config),
        // Índices são criados por migração em produção, não no boot.
        autoIndex: config.get<string>('NODE_ENV') !== 'production',
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45_000,
        connectTimeoutMS: 10_000,
      }),
    }),

    HealthModule,
    MetricsModule,
    UsersModule,
    AuthModule,
  ],
  // A ordem importa: rate limit antes da autenticação (força bruta de token
  // também é limitada) e autenticação antes do papel.
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
  ],
})
export class AppModule {}
