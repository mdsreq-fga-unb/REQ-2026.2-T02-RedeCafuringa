import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/domain/role.js';
import { RolesGuard } from './roles.guard.js';

function makeContext(user?: { id: string; perfil: Role }) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeGuard(roles: Role[] | undefined) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(roles),
  } as unknown as Reflector;

  return new RolesGuard(reflector);
}

describe('RolesGuard (RN01, RNF08)', () => {
  it('libera rota sem @Roles() para qualquer usuário autenticado', () => {
    const guard = makeGuard(undefined);

    expect(
      guard.canActivate(makeContext({ id: '1', perfil: Role.CONSUMIDOR })),
    ).toBe(true);
  });

  it('libera rota com @Roles() vazio', () => {
    expect(makeGuard([]).canActivate(makeContext())).toBe(true);
  });

  it('libera o perfil exigido', () => {
    const guard = makeGuard([Role.PRODUTOR]);

    expect(
      guard.canActivate(makeContext({ id: '1', perfil: Role.PRODUTOR })),
    ).toBe(true);
  });

  it('libera qualquer um dos perfis listados', () => {
    const guard = makeGuard([Role.PRODUTOR, Role.ADMINISTRADOR]);

    expect(
      guard.canActivate(makeContext({ id: '1', perfil: Role.ADMINISTRADOR })),
    ).toBe(true);
  });

  it('RNF08: consumidor não executa funcionalidade de produtor (403)', () => {
    const guard = makeGuard([Role.PRODUTOR]);

    expect(() =>
      guard.canActivate(makeContext({ id: '1', perfil: Role.CONSUMIDOR })),
    ).toThrow(ForbiddenException);
  });

  it('nega por padrão quando não há usuário na requisição', () => {
    const guard = makeGuard([Role.ADMINISTRADOR]);

    expect(() => guard.canActivate(makeContext())).toThrow(ForbiddenException);
  });
});
