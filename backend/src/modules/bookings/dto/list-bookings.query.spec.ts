import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListBookingsQuery } from './list-bookings.query.js';

async function check(payload: Record<string, unknown>) {
  const dto = plainToInstance(ListBookingsQuery, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('HU45 — filtros da consulta de pré-reservas', () => {
  it('aceita a consulta sem nenhum filtro', async () => {
    const { messages } = await check({});
    expect(messages).toEqual([]);
  });

  it.each(['pendente', 'aceita', 'recusada', 'cancelada'])(
    'aceita filtrar pela situação %s',
    async (status) => {
      const { messages } = await check({ status });
      expect(messages).toEqual([]);
    },
  );

  it('recusa situação fora do ciclo de vida (RN21)', async () => {
    const { messages } = await check({ status: 'concluida' });
    expect(messages.join(' ')).toContain('Situação inválida');
  });

  it('converte pagina e limite que chegam como texto na query string', async () => {
    const { dto, messages } = await check({ pagina: '2', limite: '10' });
    expect(messages).toEqual([]);
    expect(dto.pagina).toBe(2);
    expect(dto.limite).toBe(10);
  });

  it.each([
    ['página zero', { pagina: '0' }, 'Página deve ser maior ou igual a 1'],
    ['página decimal', { pagina: '1.5' }, 'Página deve ser um número inteiro'],
    ['limite zero', { limite: '0' }, 'Limite deve ser maior ou igual a 1'],
    [
      'limite acima do máximo',
      { limite: '51' },
      'Limite deve ser no máximo 50',
    ],
  ])('recusa %s', async (_caso, payload, message) => {
    const { messages } = await check(payload);
    expect(messages.join(' ')).toContain(message);
  });

  it('recusa filtros que não existem (o dono vem do token, nunca da query)', async () => {
    const { messages } = await check({
      consumidor: '64b0c0ffee0000000000b001',
    });
    expect(messages.join(' ')).toContain('should not exist');
  });
});
