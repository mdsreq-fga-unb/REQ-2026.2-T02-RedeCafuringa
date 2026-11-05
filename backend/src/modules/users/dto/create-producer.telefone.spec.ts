import { makeProducer } from '@test/factories';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProducerDto } from './create-producer.dto.js';

async function errorsFor(overrides: Partial<CreateProducerDto>) {
  return validate(plainToInstance(CreateProducerDto, makeProducer(overrides)));
}

describe('HU02 — telefone do produtor (opcional, como no consumidor)', () => {
  it('aceita DDD + número com 10 ou 11 dígitos', async () => {
    expect(await errorsFor({ telefone: '61999990000' })).toHaveLength(0);
    expect(await errorsFor({ telefone: '6133334444' })).toHaveLength(0);
  });

  it('aceita cadastro sem telefone', async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it('telefone em branco equivale a não informado', async () => {
    const dto = plainToInstance(
      CreateProducerDto,
      makeProducer({ telefone: '' }),
    );

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.telefone).toBeUndefined();
  });

  it.each(['123', '(61) 99999-0000', 'abcdefghijk', '619999900001'])(
    'rejeita telefone fora do formato (%s)',
    async (telefone) => {
      const errors = await errorsFor({ telefone });

      expect(errors.map((e) => e.property)).toContain('telefone');
    },
  );
});
