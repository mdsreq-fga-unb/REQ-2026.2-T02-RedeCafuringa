import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/domain/role.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function makeContext(headers: Record<string, string> = {}) {
  const request: { headers: Record<string, string>; user?: unknown } = {
    headers,
  };
  const context = {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { context, request };
}

function setup({
  isPublic = false,
  payload = { sub: 'user-id', perfil: Role.CONSUMIDOR } as unknown,
} = {}) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
  const jwt = {
    verifyAsync:
      payload instanceof Error
        ? vi.fn().mockRejectedValue(payload)
        : vi.fn().mockResolvedValue(payload),
  };
  const guard = new JwtAuthGuard(reflector, jwt as unknown as JwtService);

  return { guard, jwt };
}

describe('JwtAuthGuard (RNF08 — negação por padrão)', () => {
  it('libera rota marcada com @Public() sem exigir token', async () => {
    const { guard, jwt } = setup({ isPublic: true });

    await expect(guard.canActivate(makeContext().context)).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('recusa requisição sem Authorization com 401', async () => {
    const { guard } = setup();

    await expect(guard.canActivate(makeContext().context)).rejects.toThrow(
      new UnauthorizedException('Autenticação necessária'),
    );
  });

  it('recusa esquema diferente de Bearer', async () => {
    const { guard } = setup();
    const { context } = makeContext({ authorization: 'Basic abc' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('recusa token inválido ou expirado', async () => {
    const { guard } = setup({ payload: new Error('jwt expired') });
    const { context } = makeContext({ authorization: 'Bearer abc' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token inválido ou expirado'),
    );
  });

  it.each([
    ['sem sub', { perfil: Role.CONSUMIDOR }],
    ['perfil desconhecido', { sub: 'user-id', perfil: 'ROOT' }],
  ])('recusa token válido mas %s', async (_caso, payload) => {
    const { guard } = setup({ payload });
    const { context } = makeContext({ authorization: 'Bearer abc' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('anexa o usuário autenticado à requisição', async () => {
    const { guard, jwt } = setup();
    const { context, request } = makeContext({
      authorization: 'Bearer token.jwt',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('token.jwt');
    expect(request.user).toEqual({ id: 'user-id', perfil: Role.CONSUMIDOR });
  });
});
