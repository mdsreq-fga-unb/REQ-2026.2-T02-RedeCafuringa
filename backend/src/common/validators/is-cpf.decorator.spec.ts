import { makeCpf } from '@test/factories';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsCpf, NormalizeDocument } from './is-cpf.decorator.js';

class Payload {
  @NormalizeDocument()
  @IsCpf()
  cpf: unknown;
}

async function errorsFor(cpf: unknown) {
  return validate(plainToInstance(Payload, { cpf }));
}

describe('@IsCpf (RN02, RN08)', () => {
  it('aceita CPF válido sem máscara', async () => {
    expect(await errorsFor(makeCpf())).toHaveLength(0);
  });

  it('aceita CPF válido com máscara', async () => {
    expect(await errorsFor('529.982.247-25')).toHaveLength(0);
  });

  it.each(['529.982.247-26', '11111111111', '', 123, null])(
    'rejeita %s com mensagem em português',
    async (cpf) => {
      const [error] = await errorsFor(cpf);

      expect(error.constraints).toEqual({ isCpf: 'CPF inválido' });
    },
  );
});

describe('@NormalizeDocument', () => {
  it('remove a máscara antes de chegar ao service', () => {
    const payload = plainToInstance(Payload, { cpf: '529.982.247-25' });

    expect(payload.cpf).toBe('52998224725');
  });

  it('mantém valores que não são texto para a validação rejeitar', () => {
    const payload = plainToInstance(Payload, { cpf: 123 });

    expect(payload.cpf).toBe(123);
  });
});
