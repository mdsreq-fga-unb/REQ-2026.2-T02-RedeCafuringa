import type { Role } from '../../users/domain/role.js';

/** Usuário anexado a `request.user` pelo JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  perfil: Role;
}

/** Conteúdo do JWT: só o necessário para autorizar (RNF11). */
export interface JwtPayload {
  sub: string;
  perfil: Role;
  /** Emissão, em segundos (posto pelo JwtService). */
  iat?: number;
  /** Instante do login em ms: base da revogação por troca de senha (HU10). */
  sat?: number;
}
