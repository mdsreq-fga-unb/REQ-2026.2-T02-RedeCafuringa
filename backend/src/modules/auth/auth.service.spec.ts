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
    findByEmail: vi.fn().mockResolvedValue(user),
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
  describe('login (HU09, RN05)', () => {
    it('devolve token Bearer e o perfil público do usuário', async () => {
      const { service } = setup();

      await expect(
        service.login('maria@exemplo.com', 'Senha123'),
      ).resolves.toEqual({
        accessToken: 'token.jwt',
        tokenType: 'Bearer',
        expiresIn: 900,
        usuario: publicUser,
      });
    });

    it('RNF11: o token carrega só id, perfil e o instante do login em ms (sem CPF/e-mail)', async () => {
      const { service, jwt } = setup();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-06T12:00:00.250Z'));

      await service.login('maria@exemplo.com', 'Senha123');

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        perfil: Role.PRODUTOR,
        sat: new Date('2026-11-06T12:00:00.250Z').getTime(),
      });
      vi.useRealTimers();
    });

    it('recusa senha errada com 401 genérico', async () => {
      const { service, hasher } = setup();
      hasher.verify.mockResolvedValue(false);

      await expect(
        service.login('maria@exemplo.com', 'errada'),
      ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos'));
    });

    it('recusa e-mail desconhecido com o mesmo 401 e o mesmo custo de hash', async () => {
      const { service, users, hasher } = setup();
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('maria@exemplo.com', 'Senha123'),
      ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos'));
      expect(hasher.verifyDummy).toHaveBeenCalledWith('Senha123');
    });

    it('recusa conta desativada com 403 depois de validar a senha', async () => {
      const { service, users, jwt } = setup();
      users.findByEmail.mockResolvedValue({ ...user, ativo: false });

      await expect(
        service.login('maria@exemplo.com', 'Senha123'),
      ).rejects.toThrow(ForbiddenException);
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
