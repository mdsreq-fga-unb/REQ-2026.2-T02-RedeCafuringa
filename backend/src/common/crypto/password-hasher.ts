import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

/**
 * Hash de senha com argon2id (parâmetros padrão da biblioteca, alinhados à
 * recomendação da OWASP). Isolado em uma classe para ser mockado nos testes.
 */
@Injectable()
export class PasswordHasher {
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Gasta o mesmo tempo de uma verificação real e sempre recusa. Usado quando
   * o CPF não existe, para o tempo de resposta não revelar contas cadastradas.
   */
  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('senha-inexistente-para-equalizar-tempo');
    await this.verify(await this.dummyHash, password);
    return false;
  }
}
