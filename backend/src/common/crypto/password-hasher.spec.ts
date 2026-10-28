import { PasswordHasher } from './password-hasher.js';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('gera hash argon2id, nunca a senha em texto', async () => {
    const hash = await hasher.hash('SenhaForte123');

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('SenhaForte123');
  });

  it('confere a senha correta', async () => {
    const hash = await hasher.hash('SenhaForte123');

    expect(await hasher.verify(hash, 'SenhaForte123')).toBe(true);
  });

  it('recusa a senha errada', async () => {
    const hash = await hasher.hash('SenhaForte123');

    expect(await hasher.verify(hash, 'SenhaErrada123')).toBe(false);
  });

  it('recusa hash corrompido sem lançar exceção', async () => {
    expect(await hasher.verify('nao-e-um-hash', 'SenhaForte123')).toBe(false);
  });

  it('verifyDummy gasta o mesmo trabalho e sempre recusa (anti-enumeração)', async () => {
    expect(await hasher.verifyDummy('qualquer')).toBe(false);
  });
});
