import {
  ConflictException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service.js';

/**
 * HU03: o cadastro de administrador exige um administrador autenticado, então
 * o primeiro nasce aqui, das variáveis ADMIN_BOOTSTRAP_EMAIL/SENHA.
 * Idempotente: se o e-mail já existe, nada acontece.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('ADMIN_BOOTSTRAP_EMAIL');
    const senha = this.config.get<string>('ADMIN_BOOTSTRAP_SENHA');
    if (!email || !senha) return;

    try {
      await this.users.createAdmin({ email, senha });
      this.logger.log('Administrador inicial criado');
    } catch (error) {
      if (error instanceof ConflictException) return;
      throw error;
    }
  }
}
