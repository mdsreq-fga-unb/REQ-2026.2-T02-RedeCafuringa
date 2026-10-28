import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../../users/domain/role.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Guard global de papel (RN01, RNF08). Roda depois do JwtAuthGuard: rotas sem
 * @Roles() ficam abertas a qualquer usuário autenticado. A verificação de
 * propriedade do recurso (RN17, RN22...) fica no service.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!user || !roles.includes(user.perfil)) {
      throw new ForbiddenException(
        'Seu perfil não tem permissão para acessar este recurso',
      );
    }

    return true;
  }
}
