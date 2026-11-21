import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBookingDto } from './create-booking.dto.js';

const valid = {
  experienciaId: '64b0c0ffee0000000000e001',
  data: '2026-12-10',
  horario: '09:00',
  participantes: 4,
  formaPagamento: 'pix',
  mensagem: 'Vamos com duas crianças.',
};

async function check(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateBookingDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('HU44/CA04 — validação da pré-reserva', () => {
  it('aceita a solicitação completa', async () => {
    const { messages } = await check(valid);
    expect(messages).toEqual([]);
  });

  it('a mensagem ao produtor é opcional', async () => {
    const { mensagem: _mensagem, ...semMensagem } = valid;
    const { messages } = await check(semMensagem);
    expect(messages).toEqual([]);
  });

  it('normaliza a mensagem e descarta a que fica vazia', async () => {
    const limpa = await check({
      ...valid,
      mensagem: '  oi\r\ntudo bem\u0000 ',
    });
    expect(limpa.dto.mensagem).toBe('oi\ntudo bem');

    const vazia = await check({ ...valid, mensagem: '   \n ' });
    expect(vazia.messages).toEqual([]);
    expect(vazia.dto.mensagem).toBeUndefined();
  });

  it.each([
    ['experienciaId', 'Informe a experiência'],
    ['data', 'Informe a data desejada'],
    ['horario', 'Escolha o horário'],
    ['participantes', 'Informe de 1 a 50 participantes'],
    ['formaPagamento', 'Escolha a forma de pagamento'],
  ])('%s ausente: recusa com "%s"', async (campo, mensagem) => {
    const { messages } = await check({ ...valid, [campo]: undefined });
    expect(messages).toContain(mensagem);
  });

  it('recusa experiência com identificador inválido', async () => {
    const { messages } = await check({ ...valid, experienciaId: 'abc' });
    expect(messages).toContain('Experiência inválida');
  });

  it.each(['2026-02-30', '10/12/2026', '2026-12-10T09:00'])(
    'recusa a data "%s"',
    async (data) => {
      const { messages } = await check({ ...valid, data });
      expect(messages).toContain('Informe uma data válida (AAAA-MM-DD)');
    },
  );

  it.each(['9:00', '09:30', '24:00', 'manhã'])(
    'recusa o horário "%s"',
    async (horario) => {
      const { messages } = await check({ ...valid, horario });
      expect(messages).toContain('Escolha um horário da lista');
    },
  );

  it.each([0, 51, 2.5, -1, '4'])(
    'recusa %s participantes',
    async (participantes) => {
      const { messages } = await check({ ...valid, participantes });
      expect(messages).toContain('Informe de 1 a 50 participantes');
    },
  );

  it.each([1, 50])('aceita %s participantes', async (participantes) => {
    const { messages } = await check({ ...valid, participantes });
    expect(messages).toEqual([]);
  });

  it.each(['boleto', 'PIX', 'Cartão'])(
    'recusa a forma de pagamento "%s"',
    async (formaPagamento) => {
      const { messages } = await check({ ...valid, formaPagamento });
      expect(messages).toContain('Escolha uma forma de pagamento da lista');
    },
  );

  it('recusa mensagem acima de 500 caracteres', async () => {
    const { messages } = await check({ ...valid, mensagem: 'a'.repeat(501) });
    expect(messages).toContain('Mensagem deve ter no máximo 500 caracteres');
  });

  it('aceita mensagem com exatamente 500 caracteres', async () => {
    const { messages } = await check({ ...valid, mensagem: 'a'.repeat(500) });
    expect(messages).toEqual([]);
  });

  it('recusa mensagem que não é texto', async () => {
    const { messages } = await check({ ...valid, mensagem: 123 });
    expect(messages).toContain('Mensagem deve ser um texto');
  });

  it('RN19/RNF08: recusa status e dono vindos do corpo', async () => {
    const { messages } = await check({
      ...valid,
      status: 'aceita',
      consumidor: '64b0c0ffee0000000000c001',
    });
    expect(messages).toEqual(
      expect.arrayContaining([
        'property status should not exist',
        'property consumidor should not exist',
      ]),
    );
  });
});
