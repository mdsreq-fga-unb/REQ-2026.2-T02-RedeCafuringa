import { makeCnpj, makeCpf } from '@test/factories';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProducerCategory } from '../domain/producer-category.js';
import { CreateProducerDto } from './create-producer.dto.js';

function validPayload(categoriaOfertada: unknown) {
  return {
    nomeIniciativa: 'Horta Comunitária Cafuringa',
    nomeResponsavel: 'João da Silva',
    cpf: makeCpf(),
    cnpj: makeCnpj(),
    localidade: 'Fazenda da Cafuringa',
    categoriaOfertada,
    formasPagamento: ['PIX', 'Dinheiro'],
    email: 'produtor@exemplo.com',
    senha: 'SenhaForte123',
  };
}

async function errorsForProperty(property: string, value: unknown) {
  const payload = {
    ...validPayload(ProducerCategory.PRODUTOS_E_EXPERIENCIAS),
    [property]: value,
  };
  const dto = plainToInstance(CreateProducerDto, payload);
  const errors = await validate(dto);

  return errors.find((error) => error.property === property);
}

describe('HU02 — CreateProducerDto (RN02, RNF03)', () => {
  it.each([
    ProducerCategory.PRODUTOS,
    ProducerCategory.EXPERIENCIAS,
    ProducerCategory.PRODUTOS_E_EXPERIENCIAS,
  ])('HU02: aceita a categoria ofertada %s', async (categoriaOfertada) => {
    const dto = plainToInstance(
      CreateProducerDto,
      validPayload(categoriaOfertada),
    );

    expect(await validate(dto)).toHaveLength(0);
  });

  it('RN02: rejeita categoria ofertada fora das três opções', async () => {
    const dto = plainToInstance(CreateProducerDto, validPayload('Hortaliças'));

    const errors = await validate(dto);
    const categoryError = errors.find(
      (error) => error.property === 'categoriaOfertada',
    );

    expect(categoryError?.constraints?.isEnum).toContain(
      'Produtos, Experiências ou Produtos e Experiências',
    );
  });

  it.each([
    ['nomeIniciativa', undefined],
    ['nomeResponsavel', undefined],
    ['localidade', undefined],
  ])(
    'RN02: rejeita campo obrigatório inválido: %s',
    async (property, value) => {
      const error = await errorsForProperty(property, value);

      expect(error).toBeDefined();
    },
  );

  it('RNF03: rejeita CPF inválido', async () => {
    const error = await errorsForProperty('cpf', '529.982.247-26');

    expect(error?.constraints?.isCpf).toBe('CPF inválido');
  });

  it('RN02: aceita cadastro sem CNPJ', async () => {
    const payload = validPayload(ProducerCategory.PRODUTOS);
    const dto = plainToInstance(CreateProducerDto, {
      ...payload,
      cnpj: undefined,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('RNF03: rejeita CNPJ inválido', async () => {
    const error = await errorsForProperty('cnpj', '11.222.333/0001-82');

    expect(error?.constraints?.isCnpj).toBe('CNPJ inválido');
  });

  it('RN02: rejeita formas de pagamento vazias', async () => {
    const error = await errorsForProperty('formasPagamento', []);

    expect(error).toBeDefined();
  });

  it('RN02/RNF03: rejeita e-mail inválido', async () => {
    const error = await errorsForProperty('email', 'email-invalido');

    expect(error?.constraints?.isEmail).toBe('E-mail inválido');
  });

  it.each([
    ['cur1', 'Senha deve ter pelo menos 8 caracteres'],
    ['somenteletras', 'Senha deve conter pelo menos um número'],
    ['12345678', 'Senha deve conter pelo menos uma letra'],
  ])('RNF03: rejeita senha inválida: %s', async (senha) => {
    const error = await errorsForProperty('senha', senha);

    expect(error).toBeDefined();
  });

  it.each([
    ['nomeIniciativa', 120, 121],
    ['nomeResponsavel', 120, 121],
    ['localidade', 200, 201],
  ])(
    'RN02/RNF03: valida limite máximo de %s',
    async (property, acceptedLength, rejectedLength) => {
      const accepted = await errorsForProperty(
        property,
        'a'.repeat(acceptedLength),
      );
      const rejected = await errorsForProperty(
        property,
        'a'.repeat(rejectedLength),
      );

      expect(accepted).toBeUndefined();
      expect(rejected).toBeDefined();
    },
  );

  it('RNF03: aceita senha com 128 caracteres e rejeita com 129', async () => {
    const accepted = await errorsForProperty('senha', `A1${'a'.repeat(126)}`);
    const rejected = await errorsForProperty('senha', `A1${'a'.repeat(127)}`);

    expect(accepted).toBeUndefined();
    expect(rejected?.constraints?.maxLength).toBe(
      'Senha deve ter no máximo 128 caracteres',
    );
  });

  it('RNF03: rejeita e-mail com mais de 254 caracteres', async () => {
    const error = await errorsForProperty(
      'email',
      `${'a'.repeat(250)}@example.com`,
    );

    expect(error?.constraints?.maxLength).toBe(
      'E-mail deve ter no máximo 254 caracteres',
    );
  });

  it.each(['nomeIniciativa', 'nomeResponsavel', 'localidade'])(
    'RN02: rejeita %s vazio',
    async (property) => {
      const error = await errorsForProperty(property, '');

      expect(error).toBeDefined();
    },
  );

  it('RN02/RNF03: rejeita formas de pagamento que não são lista', async () => {
    const error = await errorsForProperty('formasPagamento', 'PIX');

    expect(error?.constraints?.isArray).toBe(
      'Formas de pagamento deve ser uma lista',
    );
  });

  it('RN02/RNF03: rejeita forma de pagamento que não é texto', async () => {
    const error = await errorsForProperty('formasPagamento', ['PIX', 123]);

    expect(error?.constraints?.isString).toBe(
      'Cada forma de pagamento deve ser um texto',
    );
  });

  it('RNF03: aceita CPF mascarado e normaliza seus caracteres', async () => {
    const payload = {
      ...validPayload(ProducerCategory.PRODUTOS),
      cpf: '529.982.247-25',
    };
    const dto = plainToInstance(CreateProducerDto, payload);

    expect(dto.cpf).toBe('52998224725');
    expect(await validate(dto)).toHaveLength(0);
  });

  it('RN03/RNF03: aceita CNPJ mascarado e normaliza suas letras', async () => {
    const cnpj = makeCnpj({ alfanumerico: true }).toLowerCase();
    const maskedCnpj = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
    const payload = {
      ...validPayload(ProducerCategory.PRODUTOS),
      cnpj: maskedCnpj,
    };
    const dto = plainToInstance(CreateProducerDto, payload);

    expect(dto.cnpj).toBe(cnpj.toUpperCase());
    expect(await validate(dto)).toHaveLength(0);
  });

  it('RN03/RNF03: aceita CNPJ alfanumérico válido', async () => {
    const error = await errorsForProperty(
      'cnpj',
      makeCnpj({ alfanumerico: true }),
    );

    expect(error).toBeUndefined();
  });
});
