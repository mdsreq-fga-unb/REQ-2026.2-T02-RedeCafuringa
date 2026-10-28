import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator.js';
import { MetricsRegistry } from './metrics.registry.js';

// Fora do JWT: em produção o acesso é controlado por METRICS_TOKEN (abaixo).
@ApiExcludeController()
@Public()
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsRegistry: MetricsRegistry,
    private readonly config: ConfigService,
  ) {}

  @Get()
  metrics(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const token = this.config.get<string>('METRICS_TOKEN');

    // Em produção o endpoint só existe se um token forte estiver configurado.
    if (this.config.get<string>('NODE_ENV') === 'production') {
      if (!token) {
        throw new NotFoundException();
      }
      if (authorization !== `Bearer ${token}`) {
        throw new UnauthorizedException();
      }
    }

    // Só define text/plain no sucesso; erros seguem o filtro JSON do Nest.
    response.setHeader(
      'Content-Type',
      'text/plain; version=0.0.4; charset=utf-8',
    );
    response.setHeader('Cache-Control', 'no-store');

    return this.metricsRegistry.metrics();
  }
}
