import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIObject } from '@nestjs/swagger';
import { OPENAPI_VERSION } from '../app.setup.js';
import { generateOpenApiDocument } from './generate-openapi.js';

type Operation = {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Record<string, string[]>[];
  responses: Record<string, { content?: unknown; headers?: unknown }>;
};

describe('contrato OpenAPI', () => {
  let doc: OpenAPIObject;
  let operations: { method: string; path: string; op: Operation }[];

  beforeAll(async () => {
    doc = await generateOpenApiDocument();
    operations = Object.entries(doc.paths).flatMap(([path, item]) =>
      Object.entries(item as Record<string, Operation>)
        .filter(([method]) =>
          ['get', 'post', 'put', 'patch', 'delete'].includes(method),
        )
        .map(([method, op]) => ({ method, path, op })),
    );
  }, 60_000);

  it('é um OpenAPI 3 válido (referências resolvem, schemas bem formados)', async () => {
    await expect(
      SwaggerParser.validate(structuredClone(doc) as never),
    ).resolves.toBeDefined();
  });

  it('declara versão do contrato, servidor, contato e esquema Bearer', () => {
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.version).toBe(OPENAPI_VERSION);
    expect(doc.info.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(doc.info.contact?.name).toBe('Equipe Bytelab');
    expect(doc.servers?.length).toBeGreaterThan(0);
    expect(doc.components?.securitySchemes).toMatchObject({
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    });
  });

  it('expõe exatamente as rotas públicas esperadas e nenhuma de métricas', () => {
    expect(
      operations.map((o) => `${o.method.toUpperCase()} ${o.path}`).sort(),
    ).toEqual([
      'GET /api/v1/auth/me',
      'GET /api/v1/health',
      'GET /api/v1/health/live',
      'GET /api/v1/health/ready',
      'POST /api/v1/auth/login',
      'POST /api/v1/users/consumers',
    ]);
  });

  it('toda operação tem operationId único, resumo, descrição e tag', () => {
    const ids = operations.map((o) => o.op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { method, path, op } of operations) {
      const name = `${method} ${path}`;
      expect(op.operationId, name).toMatch(/^[a-z]+[A-Za-z]+$/);
      expect(op.summary, name).toBeTruthy();
      expect(op.description, name).toBeTruthy();
      expect(op.tags?.length, name).toBeGreaterThan(0);
    }
  });

  it('toda tag usada está descrita', () => {
    const described = new Set((doc.tags ?? []).map((t) => t.name));
    for (const { op } of operations) {
      for (const tag of op.tags ?? []) expect(described.has(tag)).toBe(true);
    }
  });

  it('só /auth/me exige Bearer; o resto é público', () => {
    const protectedOps = operations
      .filter((o) => o.op.security?.some((s) => 'bearer' in s))
      .map((o) => `${o.method} ${o.path}`);
    expect(protectedOps).toEqual(['get /api/v1/auth/me']);
  });

  it('respostas de erro usam o schema ErrorResponse; 429 documenta Retry-After', () => {
    expect(doc.components?.schemas).toHaveProperty('ErrorResponse');
    for (const { method, path, op } of operations) {
      for (const [status, response] of Object.entries(op.responses)) {
        if (!status.startsWith('4')) continue;
        expect(
          JSON.stringify(response),
          `${method} ${path} ${status}`,
        ).toContain('#/components/schemas/ErrorResponse');
        if (status === '429') {
          expect(response.headers, `${method} ${path}`).toHaveProperty(
            'Retry-After',
          );
        }
      }
    }
  });

  it('não vaza dados sensíveis nos schemas (senha só na entrada, CPF mascarado na saída)', () => {
    const schemas = doc.components?.schemas as Record<
      string,
      { properties?: Record<string, { description?: string }> }
    >;
    for (const out of ['UserResponse', 'LoginResponse']) {
      expect(Object.keys(schemas[out].properties ?? {})).not.toContain('senha');
      expect(Object.keys(schemas[out].properties ?? {})).not.toContain('hash');
    }
    expect(schemas.UserResponse.properties?.cpf.description).toMatch(
      /mascarado/i,
    );
  });
});
