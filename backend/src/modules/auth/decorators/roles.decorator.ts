import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import type { Role } from '../../users/domain/role.js';

export const ROLES_KEY = 'auth:roles';

/**
 * Restringe a rota aos perfis listados (RN01, RNF08). Não há hierarquia:
 * um administrador só acessa rota de produtor se ela listar ADMINISTRADOR.
 */
export const Roles = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiForbiddenResponse({
      description: `Exclusivo para: ${roles.join(', ')}`,
    }),
  );
