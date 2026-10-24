import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from '@prometheus-io/client';
import type { NextFunction, Request, Response } from 'express';

type HttpLabels = 'method' | 'route' | 'status';

/**
 * Registro de métricas Prometheus da API.
 *
 * O middleware mede latência e volume por método/rota/status. A rota vem de
 * `req.route.path` (padrão do Express), nunca da URL crua, para não criar
 * cardinalidade com IDs.
 */
@Injectable()
export class MetricsRegistry {
  readonly registry = new Registry();

  private readonly httpRequestsTotal: Counter<HttpLabels>;
  private readonly httpRequestDuration: Histogram<HttpLabels>;

  constructor() {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'cafuringa_',
    });

    this.httpRequestsTotal = new Counter({
      name: 'cafuringa_http_requests_total',
      help: 'Total de requisições HTTP por método, rota e status.',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'cafuringa_http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos.',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startedAt = process.hrtime.bigint();

      res.on('finish', () => {
        const route = (req.route?.path as string | undefined) ?? 'unmatched';
        const labels = {
          method: req.method,
          route,
          status: String(res.statusCode),
        };

        this.httpRequestsTotal.inc(labels);
        this.httpRequestDuration.observe(
          labels,
          Number(process.hrtime.bigint() - startedAt) / 1e9,
        );
      });

      next();
    };
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
