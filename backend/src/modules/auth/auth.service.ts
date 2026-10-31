import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordHasher } from '../../common/crypto/password-hasher.js';
import { UserResponse } from '../users/dto/user.response.js';
import { UsersService } from '../users/users.service.js';
import { LoginResponse } from './dto/login.response.js';
import type { JwtPayload } from './types/authenticated-user.js';

// Mesma mensagem para CPF inexistente e senha errada: não revela contas.
const INVALID_CREDENTIALS = 'CPF ou senha inválidos';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** HU09 / RN08: autentica por CPF e senha e emite o token de acesso. */
  async login(cpf: string, senha: string): Promise<LoginResponse> {
    const user = await this.users.findByCpf(cpf);
    if (!user) {
      await this.hasher.verifyDummy(senha);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!(await this.hasher.verify(user.senhaHash, senha))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!user.ativo) {
      throw new ForbiddenException(
        'Conta desativada. Procure a administração da Rede Cafuringa.',
      );
    }

    const payload: JwtPayload = { sub: user.id as string, perfil: user.perfil };

    return {
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: this.config.get<number>('JWT_EXPIRES_IN', 900),
      usuario: this.users.toResponse(user),
    };
  }

  /** Perfil do usuário autenticado; recusa contas removidas ou desativadas. */
  async profile(userId: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user?.ativo) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    return this.users.toResponse(user);
  }
}
