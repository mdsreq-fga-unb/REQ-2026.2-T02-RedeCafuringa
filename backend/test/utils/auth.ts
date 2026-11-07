import { createHmac } from 'node:crypto';
import { makeConsumer, makeProducer, VALID_PASSWORD } from '@test/factories';
import { Role } from '../../src/modules/users/domain/role.js';
import type { CreateConsumerDto } from '../../src/modules/users/dto/create-consumer.dto.js';
import type { CreateProducerDto } from '../../src/modules/users/dto/create-producer.dto.js';
import { UsersService } from '../../src/modules/users/users.service.js';
import { TEST_JWT_SECRET, type TestApp } from './test-app.js';

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/**
 * Assina um JWT à mão, para os cenários negativos (expirado, outro segredo,
 * alg "none") que a API nunca emitiria.
 */
export function forgeToken(
  payload: Record<string, unknown>,
  {
    secret = TEST_JWT_SECRET,
    alg = 'HS256',
    expiresIn = 900,
  }: { secret?: string; alg?: string; expiresIn?: number } = {},
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg, typ: 'JWT' });
  const body = base64url({ iat: now, exp: now + expiresIn, ...payload });
  const signature =
    alg === 'none'
      ? ''
      : createHmac('sha256', secret)
          .update(`${header}.${body}`)
          .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Cria um usuário direto pelo service, com os dados de consumidor e o perfil
 * informado: atalho para testes que só precisam de uma conta daquele perfil.
 */
export async function seedUser(
  t: TestApp,
  perfil: Role,
  overrides: Partial<CreateConsumerDto> = {},
) {
  const dto = makeConsumer(overrides);
  const user = await t.app.get(UsersService).create(dto, perfil);

  return { user, cpf: dto.cpf, email: dto.email, senha: dto.senha };
}

/** Semeia um produtor completo pelo fluxo da HU02. */
export async function seedProducer(
  t: TestApp,
  overrides: Partial<CreateProducerDto> = {},
) {
  const dto = makeProducer(overrides);
  const user = await t.app.get(UsersService).createProducer(dto);

  return { user, dto };
}

/** Semeia um administrador pelo fluxo da HU03 (só e-mail e senha). */
export async function seedAdmin(t: TestApp, email = makeConsumer().email) {
  const user = await t.app
    .get(UsersService)
    .createAdmin({ email, senha: VALID_PASSWORD });

  return { user, email, senha: VALID_PASSWORD };
}

/** Semeia um usuário do perfil informado e devolve o token de acesso. */
export async function loginAs(t: TestApp, perfil: Role): Promise<string> {
  const { email, senha } = await seedUser(t, perfil);
  const response = await t
    .request()
    .post('/api/v1/auth/login')
    .send({ email, senha })
    .expect(200);

  return response.body.accessToken as string;
}
