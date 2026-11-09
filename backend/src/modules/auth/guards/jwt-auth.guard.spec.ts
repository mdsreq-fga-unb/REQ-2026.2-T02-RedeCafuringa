import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/domain/role.js';
import type { UsersService } from '../../users/users.service.js';
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
  payload = { sub: 'user-id', perfil: Role.CONSUMIDOR, iat: 1000 } as unknown,
  account = { ativo: true, perfil: Role.CONSUMIDOR } as unknown,
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
  const users = { findSessionState: vi.fn().mockResolvedValue(account) };
  const guard = new JwtAuthGuard(
    reflector,
    jwt as unknown as JwtService,
    users as unknown as UsersService,
  );

  return { guard, jwt, users };
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

  describe('revogação (HU10): o token só vale enquanto a conta o sustenta', () => {
    it('consulta o estado da conta do token', async () => {
      const { guard, users } = setup();
      const { context } = makeContext({ authorization: 'Bearer abc' });

      await guard.canActivate(context);

      expect(users.findSessionState).toHaveBeenCalledWith('user-id');
    });

    it('rota pública não consulta o banco', async () => {
      const { guard, users } = setup({ isPublic: true });

      await guard.canActivate(makeContext().context);

      expect(users.findSessionState).not.toHaveBeenCalled();
    });

    it.each([
      ['conta removida', null],
      ['conta desativada', { ativo: false, perfil: Role.CONSUMIDOR }],
      ['perfil alterado', { ativo: true, perfil: Role.PRODUTOR }],
      [
        'senha trocada depois da emissão',
        {
          ativo: true,
          perfil: Role.CONSUMIDOR,
          credenciaisAlteradasEm: new Date(2000 * 1000),
        },
      ],
    ])('%s: 401 com orientação para entrar de novo', async (_caso, account) => {
      const { guard } = setup({ account });
      const { context, request } = makeContext({ authorization: 'Bearer abc' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Sessão encerrada. Faça login novamente.'),
      );
      expect(request.user).toBeUndefined();
    });

    it('token emitido depois da troca de senha: aceito', async () => {
      const { guard } = setup({
        account: {
          ativo: true,
          perfil: Role.CONSUMIDOR,
          credenciaisAlteradasEm: new Date(500 * 1000),
        },
      });
      const { context } = makeContext({ authorization: 'Bearer abc' });

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });
});
