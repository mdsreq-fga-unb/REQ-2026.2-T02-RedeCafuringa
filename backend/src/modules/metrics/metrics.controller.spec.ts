import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { MetricsController } from './metrics.controller.js';
import type { MetricsRegistry } from './metrics.registry.js';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

function makeResponse(): {
  response: Response;
  setHeader: ReturnType<typeof vi.fn>;
} {
  const setHeader = vi.fn();

  return {
    response: { setHeader } as unknown as Response,
    setHeader,
  };
}

function makeRegistry(): MetricsRegistry {
  return {
    metrics: vi.fn().mockResolvedValue('# HELP metric 1'),
  } as unknown as MetricsRegistry;
}

describe('MetricsController', () => {
  it('em produção, 404 quando METRICS_TOKEN não está configurado', () => {
    const controller = new MetricsController(
      makeRegistry(),
      makeConfig({ NODE_ENV: 'production' }),
    );

    expect(() =>
      controller.metrics(undefined, makeResponse().response),
    ).toThrow(NotFoundException);
  });

  it('em produção, 401 sem o bearer correto', () => {
    const controller = new MetricsController(
      makeRegistry(),
      makeConfig({
        NODE_ENV: 'production',
        METRICS_TOKEN: '0123456789abcdef',
      }),
    );

    expect(() =>
      controller.metrics('Bearer errado', makeResponse().response),
    ).toThrow(UnauthorizedException);
  });

  it('em produção, 200 com o bearer correto e headers de texto', async () => {
    const registry = makeRegistry();
    const { response, setHeader } = makeResponse();
    const controller = new MetricsController(
      registry,
      makeConfig({
        NODE_ENV: 'production',
        METRICS_TOKEN: '0123456789abcdef',
      }),
    );

    await expect(
      controller.metrics('Bearer 0123456789abcdef', response),
    ).resolves.toContain('metric');
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain; version=0.0.4; charset=utf-8',
    );
  });

  it('em desenvolvimento, não exige token', async () => {
    const controller = new MetricsController(
      makeRegistry(),
      makeConfig({ NODE_ENV: 'development' }),
    );

    await expect(
      controller.metrics(undefined, makeResponse().response),
    ).resolves.toContain('metric');
  });
});
