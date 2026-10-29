import { createHmac } from 'node:crypto';
import { makeConsumer } from '@test/factories';
import { Role } from '../../src/modules/users/domain/role.js';
import type { CreateConsumerDto } from '../../src/modules/users/dto/create-consumer.dto.js';
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
 * Cria um usuário direto pelo service. Produtor e administrador ainda não
 * têm cadastro público (HU02/HU03), então os testes os semeiam assim.
 */
export async function seedUser(
  t: TestApp,
  perfil: Role,
  overrides: Partial<CreateConsumerDto> = {},
) {
  const dto = makeConsumer(overrides);
  const user = await t.app.get(UsersService).create(dto, perfil);

  return { user, cpf: dto.cpf, senha: dto.senha };
}

/** Semeia um usuário do perfil informado e devolve o token de acesso. */
export async function loginAs(t: TestApp, perfil: Role): Promise<string> {
  const { cpf, senha } = await seedUser(t, perfil);
  const response = await t
    .request()
    .post('/api/v1/auth/login')
    .send({ cpf, senha })
    .expect(200);

  return response.body.accessToken as string;
}
