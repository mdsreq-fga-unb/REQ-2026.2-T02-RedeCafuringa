import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIObject } from '@nestjs/swagger';
import { getMetadataStorage } from 'class-validator';
import { OPENAPI_VERSION } from '../app.setup.js';
import { ErrorResponse } from '../common/dto/error.response.js';
import { LoginDto } from '../modules/auth/dto/login.dto.js';
import { LoginResponse } from '../modules/auth/dto/login.response.js';
import { CreateConsumerDto } from '../modules/users/dto/create-consumer.dto.js';
import { UserResponse } from '../modules/users/dto/user.response.js';
import { generateOpenApiDocument } from './generate-openapi.js';

type SchemaProperty = {
  description?: string;
  example?: unknown;
  $ref?: string;
};

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
      'GET /api/v1/producers/me/trajectory',
      'GET /api/v1/producers/{id}/trajectory',
      'POST /api/v1/auth/login',
      'POST /api/v1/users/admins',
      'POST /api/v1/users/consumers',
      'POST /api/v1/users/producers',
      'PUT /api/v1/producers/me/trajectory',
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

  it('só /auth/me, o cadastro de administrador e a trajetória própria exigem Bearer; o resto é público', () => {
    const protectedOps = operations
      .filter((o) => o.op.security?.some((s) => 'bearer' in s))
      .map((o) => `${o.method} ${o.path}`);
    expect(protectedOps.sort()).toEqual([
      'get /api/v1/auth/me',
      'get /api/v1/producers/me/trajectory',
      'post /api/v1/users/admins',
      'put /api/v1/producers/me/trajectory',
    ]);
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
    for (const out of [
      'UserResponse',
      'ProducerResponse',
      'AdminResponse',
      'LoginResponse',
    ]) {
      expect(Object.keys(schemas[out].properties ?? {})).not.toContain('senha');
      expect(Object.keys(schemas[out].properties ?? {})).not.toContain('hash');
    }
    expect(schemas.UserResponse.properties?.cpf.description).toMatch(
      /mascarado/i,
    );
  });

  it('toda propriedade de schema tem descrição ou exemplo', () => {
    const schemas = doc.components?.schemas as Record<
      string,
      { properties?: Record<string, SchemaProperty> }
    >;
    for (const [schemaName, schema] of Object.entries(schemas)) {
      for (const [prop, def] of Object.entries(schema.properties ?? {})) {
        expect(
          def.description || def.example !== undefined || def.$ref,
          `${schemaName}.${prop}`,
        ).toBeTruthy();
      }
    }
  });

  it('toda operação documenta uma resposta de sucesso (2xx)', () => {
    for (const { method, path, op } of operations) {
      const success = Object.entries(op.responses).filter(([status]) =>
        status.startsWith('2'),
      );
      expect(success.length, `${method} ${path}`).toBeGreaterThan(0);
      for (const [status, response] of success) {
        // 204 e respostas sem corpo não têm schema; o resto precisa tê-lo.
        if (status === '204') continue;
        expect(
          JSON.stringify(response),
          `${method} ${path} ${status}`,
        ).toContain('"schema"');
      }
    }
  });

  it('campo @IsOptional nos DTOs de entrada não aparece como obrigatório', () => {
    const schemas = doc.components?.schemas as Record<
      string,
      { required?: string[] }
    >;
    const storage = getMetadataStorage();
    for (const dto of [LoginDto, CreateConsumerDto]) {
      const optional = storage
        .getTargetValidationMetadatas(dto, '', false, false)
        .filter((m) => m.type === 'conditionalValidation')
        .map((m) => m.propertyName);
      for (const prop of optional) {
        expect(
          schemas[dto.name].required ?? [],
          `${dto.name}.${prop}`,
        ).not.toContain(prop);
      }
    }
  });

  it('todo DTO usado na API aparece no contrato', () => {
    const names = Object.keys(doc.components?.schemas ?? {});
    for (const dto of [
      ErrorResponse,
      LoginDto,
      LoginResponse,
      CreateConsumerDto,
      UserResponse,
    ]) {
      expect(names).toContain(dto.name);
    }
  });
});
