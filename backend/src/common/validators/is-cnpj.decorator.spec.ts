import { makeCnpj } from '@test/factories';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsCnpj, NormalizeDocument } from './is-cnpj.decorator.js';

class Payload {
  @NormalizeDocument()
  @IsCnpj()
  cnpj: unknown;
}

async function errorsFor(cnpj: unknown) {
  return validate(plainToInstance(Payload, { cnpj }));
}

describe('@IsCnpj (RF02, RN02)', () => {
  it('aceita CNPJ numérico válido sem máscara', async () => {
    expect(await errorsFor(makeCnpj())).toHaveLength(0);
  });

  describe('@NormalizeDocument aplicado ao CNPJ', () => {
    it('remove a máscara antes de chegar ao service', () => {
      const payload = plainToInstance(Payload, {
        cnpj: '11.222.333/0001-81',
      });

      expect(payload.cnpj).toBe('11222333000181');
    });

    it('normaliza letras do CNPJ alfanumérico para maiúsculas', () => {
      const payload = plainToInstance(Payload, {
        cnpj: '12.abc34501-de',
      });

      expect(payload.cnpj).toBe('12ABC34501DE');
    });
  });

  it('aceita CNPJ numérico válido com máscara', async () => {
    expect(await errorsFor('11.222.333/0001-81')).toHaveLength(0);
  });

  it('aceita CNPJ alfanumérico válido', async () => {
    expect(await errorsFor(makeCnpj({ alfanumerico: true }))).toHaveLength(0);
  });

  it.each(['11.222.333/0001-82', '11111111111111', '', 123, null])(
    'rejeita %s com mensagem em português',
    async (cnpj) => {
      const [error] = await errorsFor(cnpj);

      expect(error.constraints).toEqual({ isCnpj: 'CNPJ inválido' });
    },
  );
});
