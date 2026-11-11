import { Controller, Get, Module } from '@nestjs/common';
import { CurrentUser } from '../../src/modules/auth/decorators/current-user.decorator.js';
import { Public } from '../../src/modules/auth/decorators/public.decorator.js';
import { Roles } from '../../src/modules/auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../../src/modules/auth/types/authenticated-user.js';
import { Role } from '../../src/modules/users/domain/role.js';

/**
 * Rotas de sondagem usadas só nos e2e de RBAC: provam o comportamento dos
 * guards globais antes de existirem as funcionalidades reais de cada perfil.
 */
@Controller('__probe')
class RolesProbeController {
  @Public()
  @Get('public')
  publicRoute() {
    return { ok: true };
  }

  @Get('authenticated')
  authenticated(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Roles(Role.PRODUTOR)
  @Get('producer')
  producerOnly() {
    return { ok: true };
  }

  @Roles(Role.ADMINISTRADOR)
  @Get('admin')
  adminOnly() {
    return { ok: true };
  }

  @Roles(Role.PRODUTOR, Role.ADMINISTRADOR)
  @Get('producer-or-admin')
  producerOrAdmin() {
    return { ok: true };
  }
}

@Module({ controllers: [RolesProbeController] })
export class RolesProbeModule {}
