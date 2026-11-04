import { makeCpf } from '@test/factories';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProducerCategory } from '../domain/producer-category.js';
import { CreateProducerDto } from './create-producer.dto.js';

function validPayload(categoriaOfertada: unknown) {
  return {
    nomeIniciativa: 'Horta Comunitária Cafuringa',
    nomeResponsavel: 'João da Silva',
    cpf: makeCpf(),
    localidade: 'Fazenda da Cafuringa',
    categoriaOfertada,
    formasPagamento: ['PIX', 'Dinheiro'],
    email: 'produtor@exemplo.com',
    senha: 'SenhaForte123',
  };
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
});
