import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdminDto } from './create-admin.dto.js';

async function errorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateAdminDto, payload);
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

const valid = { email: 'admin@exemplo.com', senha: 'SenhaForte123' };

describe('HU03 — CreateAdminDto (RF03, RNF03)', () => {
  it('CA01: aceita e-mail válido e senha que atende à política', async () => {
    expect(await errorsFor(valid)).toHaveLength(0);
  });

  it('CA02: exige e-mail e senha', async () => {
    const errors = await errorsFor({});

    expect(errors.map((e) => e.property).sort()).toEqual(['email', 'senha']);
  });

  it.each(['sem-arroba', 'a@', '@b.com', 'a b@c.com', ''])(
    'CA03: rejeita e-mail em formato inválido (%s)',
    async (email) => {
      const errors = await errorsFor({ ...valid, email });

      expect(errors.map((e) => e.property)).toContain('email');
    },
  );

  it.each([
    ['curta', 'Ab1'],
    ['sem letra', '12345678'],
    ['sem número', 'SomenteLetras'],
    ['longa demais', `A1${'x'.repeat(130)}`],
  ])('CA02: rejeita senha %s', async (_caso, senha) => {
    const errors = await errorsFor({ ...valid, senha });

    expect(errors.map((e) => e.property)).toContain('senha');
  });

  it('RN01: não aceita o campo perfil (o perfil é sempre administrador)', async () => {
    const errors = await errorsFor({ ...valid, perfil: 'ADMINISTRADOR' });

    expect(errors.map((e) => e.property)).toContain('perfil');
  });
});
