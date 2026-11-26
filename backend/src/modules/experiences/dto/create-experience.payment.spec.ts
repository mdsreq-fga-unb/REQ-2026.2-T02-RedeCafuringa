import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExperienceDto } from './create-experience.dto.js';

/** Campos de texto como chegam do multipart. */
const base = {
  nome: 'Trilha guiada da nascente',
  categoria: 'Experiência',
  descricao: 'Caminhada de 3 km até a nascente.',
  valorPorPessoa: '45',
  local: 'Sítio Boa Vista',
  duracao: '2 horas',
};

async function check(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateExperienceDto, { ...base, ...extra });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('experiência — sinal e formas de pagamento no dia', () => {
  it('por padrão, nada é informado (a API assume que exige sinal)', async () => {
    const { dto, messages } = await check({});

    expect(messages).toEqual([]);
    expect(dto.exigeSinal).toBeUndefined();
    expect(dto.formasPagamentoNoDia).toBeUndefined();
  });

  it.each([
    ['false', false],
    ['true', true],
  ])('exigeSinal %j do formulário vira %s', async (value, expected) => {
    const { dto, messages } = await check({ exigeSinal: value });

    expect(messages).toEqual([]);
    expect(dto.exigeSinal).toBe(expected);
  });

  it('recusa exigeSinal que não é verdadeiro ou falso', async () => {
    expect((await check({ exigeSinal: 'talvez' })).messages).toEqual([
      'exigeSinal deve ser verdadeiro ou falso',
    ]);
  });

  it('formas aceitas no dia, separadas por vírgula', async () => {
    const { dto, messages } = await check({
      formasPagamentoNoDia: 'dinheiro, pix',
    });

    expect(messages).toEqual([]);
    expect(dto.formasPagamentoNoDia).toEqual(['dinheiro', 'pix']);
  });

  it('recusa forma de pagamento desconhecida', async () => {
    expect(
      (await check({ formasPagamentoNoDia: 'dinheiro,boleto' })).messages,
    ).toEqual([
      'Formas de pagamento no dia devem ser pix, dinheiro, cartao_credito ou cartao_debito',
    ]);
  });
});
