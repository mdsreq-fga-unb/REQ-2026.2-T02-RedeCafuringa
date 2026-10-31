import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { PasswordHasher } from '../../common/crypto/password-hasher.js';
import { Role } from '../users/domain/role.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

const user = {
  id: '665f1c2e9b1d8a0012345678',
  perfil: Role.PRODUTOR,
  senhaHash: 'hash',
  ativo: true,
};
const publicUser = { id: user.id, nome: 'Maria', perfil: Role.PRODUTOR };

function setup() {
  const users = {
    findByCpf: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    toResponse: vi.fn().mockReturnValue(publicUser),
  };
  const hasher = {
    verify: vi.fn().mockResolvedValue(true),
    verifyDummy: vi.fn().mockResolvedValue(false),
  };
  const jwt = { signAsync: vi.fn().mockResolvedValue('token.jwt') };
  const config = { get: vi.fn().mockReturnValue(900) };
  const service = new AuthService(
    users as unknown as UsersService,
    hasher as unknown as PasswordHasher,
    jwt as unknown as JwtService,
    config as unknown as ConfigService,
  );

  return { service, users, hasher, jwt };
}

describe('AuthService', () => {
  describe('login (HU09, RN08)', () => {
    it('devolve token Bearer e o perfil público do usuário', async () => {
      const { service } = setup();

      await expect(service.login('52998224725', 'Senha123')).resolves.toEqual({
        accessToken: 'token.jwt',
        tokenType: 'Bearer',
        expiresIn: 900,
        usuario: publicUser,
      });
    });

    it('RNF11: o token carrega só id e perfil (sem CPF/e-mail)', async () => {
      const { service, jwt } = setup();

      await service.login('52998224725', 'Senha123');

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        perfil: Role.PRODUTOR,
      });
    });

    it('recusa senha errada com 401 genérico', async () => {
      const { service, hasher } = setup();
      hasher.verify.mockResolvedValue(false);

      await expect(service.login('52998224725', 'errada')).rejects.toThrow(
        new UnauthorizedException('CPF ou senha inválidos'),
      );
    });

    it('recusa CPF desconhecido com o mesmo 401 e o mesmo custo de hash', async () => {
      const { service, users, hasher } = setup();
      users.findByCpf.mockResolvedValue(null);

      await expect(service.login('52998224725', 'Senha123')).rejects.toThrow(
        new UnauthorizedException('CPF ou senha inválidos'),
      );
      expect(hasher.verifyDummy).toHaveBeenCalledWith('Senha123');
    });

    it('recusa conta desativada com 403 depois de validar a senha', async () => {
      const { service, users, jwt } = setup();
      users.findByCpf.mockResolvedValue({ ...user, ativo: false });

      await expect(service.login('52998224725', 'Senha123')).rejects.toThrow(
        ForbiddenException,
      );
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('profile', () => {
    it('devolve o perfil do usuário autenticado', async () => {
      const { service } = setup();

      await expect(service.profile(user.id)).resolves.toEqual(publicUser);
    });

    it.each([
      ['inexistente', null],
      ['desativado', { ...user, ativo: false }],
    ])('recusa sessão de usuário %s com 401', async (_caso, found) => {
      const { service, users } = setup();
      users.findById.mockResolvedValue(found);

      await expect(service.profile(user.id)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
