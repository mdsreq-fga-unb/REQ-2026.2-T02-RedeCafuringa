import type { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { AdminBootstrapService } from './admin-bootstrap.service.js';
import type { UsersService } from './users.service.js';

function setup(env: Record<string, string | undefined>) {
  const users = {
    createAdmin: vi.fn().mockResolvedValue({ id: '1' }),
  };
  const config = { get: vi.fn((key: string) => env[key]) };
  const service = new AdminBootstrapService(
    users as unknown as UsersService,
    config as unknown as ConfigService,
  );

  return { service, users };
}

describe('AdminBootstrapService (HU03: 1º administrador)', () => {
  it('cria o administrador inicial quando as variáveis estão definidas', async () => {
    const { service, users } = setup({
      ADMIN_BOOTSTRAP_EMAIL: 'admin@exemplo.com',
      ADMIN_BOOTSTRAP_SENHA: 'SenhaForte123',
    });

    await service.onApplicationBootstrap();

    expect(users.createAdmin).toHaveBeenCalledWith({
      email: 'admin@exemplo.com',
      senha: 'SenhaForte123',
    });
  });

  it('não faz nada sem as variáveis', async () => {
    const { service, users } = setup({});

    await service.onApplicationBootstrap();

    expect(users.createAdmin).not.toHaveBeenCalled();
  });

  it('é idempotente: e-mail já cadastrado não derruba a aplicação', async () => {
    const { service, users } = setup({
      ADMIN_BOOTSTRAP_EMAIL: 'admin@exemplo.com',
      ADMIN_BOOTSTRAP_SENHA: 'SenhaForte123',
    });
    users.createAdmin.mockRejectedValue(new ConflictException());

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it('propaga erros inesperados', async () => {
    const { service, users } = setup({
      ADMIN_BOOTSTRAP_EMAIL: 'admin@exemplo.com',
      ADMIN_BOOTSTRAP_SENHA: 'SenhaForte123',
    });
    users.createAdmin.mockRejectedValue(new Error('banco fora do ar'));

    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'banco fora do ar',
    );
  });
});
