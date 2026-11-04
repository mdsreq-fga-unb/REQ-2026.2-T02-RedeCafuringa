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

describe('CreateProducerDto', () => {
  it.each([
    ProducerCategory.PRODUTOS,
    ProducerCategory.EXPERIENCIAS,
    ProducerCategory.PRODUTOS_E_EXPERIENCIAS,
  ])('aceita a categoria ofertada %s', async (categoriaOfertada) => {
    const dto = plainToInstance(
      CreateProducerDto,
      validPayload(categoriaOfertada),
    );

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita categoria ofertada fora das três opções', async () => {
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
  ])('rejeita campo obrigatório inválido: %s', async (property, value) => {
    const error = await errorsForProperty(property, value);

    expect(error).toBeDefined();
  });

  it('rejeita CPF inválido', async () => {
    const error = await errorsForProperty('cpf', '529.982.247-26');

    expect(error?.constraints?.isCpf).toBe('CPF inválido');
  });

  it('aceita cadastro sem CNPJ', async () => {
    const payload = validPayload(ProducerCategory.PRODUTOS);
    const dto = plainToInstance(CreateProducerDto, {
      ...payload,
      cnpj: undefined,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita CNPJ inválido', async () => {
    const error = await errorsForProperty('cnpj', '11.222.333/0001-82');

    expect(error?.constraints?.isCnpj).toBe('CNPJ inválido');
  });

  it('rejeita formas de pagamento vazias', async () => {
    const error = await errorsForProperty('formasPagamento', []);

    expect(error).toBeDefined();
  });

  it('rejeita e-mail inválido', async () => {
    const error = await errorsForProperty('email', 'email-invalido');

    expect(error?.constraints?.isEmail).toBe('E-mail inválido');
  });

  it.each([
    ['cur1', 'Senha deve ter pelo menos 8 caracteres'],
    ['somenteletras', 'Senha deve conter pelo menos um número'],
    ['12345678', 'Senha deve conter pelo menos uma letra'],
  ])('rejeita senha inválida: %s', async (senha) => {
    const error = await errorsForProperty('senha', senha);

    expect(error).toBeDefined();
  });
});
