import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { isRole } from '../../users/domain/role.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../types/authenticated-user.js';

interface AuthRequest {
  headers: { authorization?: string };
  user?: AuthenticatedUser;
}

/**
 * Guard global: toda rota exige um JWT válido, exceto as marcadas com
 * @Public() (negação por padrão — RNF08).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Autenticação necessária');
    }

    let payload: Partial<JwtPayload>;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (typeof payload.sub !== 'string' || !isRole(payload.perfil)) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request.user = { id: payload.sub, perfil: payload.perfil };
    return true;
  }
}
