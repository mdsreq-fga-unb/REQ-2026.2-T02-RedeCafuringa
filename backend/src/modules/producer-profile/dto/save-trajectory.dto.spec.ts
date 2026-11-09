import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveTrajectoryDto } from './save-trajectory.dto.js';

async function check(payload: Record<string, unknown>) {
  const dto = plainToInstance(SaveTrajectoryDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('HU12/CA03 — validação da trajetória', () => {
  it('aceita trajetória e atividades válidas', async () => {
    const { messages } = await check({
      trajetoria: 'Começamos em 1990.',
      atividades: 'Horta e visitas.',
    });
    expect(messages).toEqual([]);
  });

  it('atividades, telefone e visibilidade são opcionais', async () => {
    const { messages } = await check({ trajetoria: 'Minha história' });
    expect(messages).toEqual([]);
  });

  it('normaliza o texto: espaços, quebras e caracteres de controle', async () => {
    const { dto } = await check({
      trajetoria: '  linha 1\r\nlinha 2\u0000  ',
      atividades: '  x ',
    });
    expect(dto.trajetoria).toBe('linha 1\nlinha 2');
    expect(dto.atividades).toBe('x');
  });

  it.each([
    ['ausente', undefined],
    ['vazia', ''],
    ['só espaços', '   \n '],
    ['só caracteres de controle', '\u0000\u0007'],
  ])('trajetória %s: recusa com mensagem', async (_nome, trajetoria) => {
    const { messages } = await check({ trajetoria });
    expect(messages).toContain('Trajetória é obrigatória');
  });

  it('recusa trajetória acima de 2000 caracteres', async () => {
    const { messages } = await check({ trajetoria: 'a'.repeat(2001) });
    expect(messages).toContain('Trajetória deve ter no máximo 2000 caracteres');
  });

  it('aceita trajetória com exatamente 2000 caracteres', async () => {
    const { messages } = await check({ trajetoria: 'a'.repeat(2000) });
    expect(messages).toEqual([]);
  });

  it('recusa atividades acima de 2000 caracteres', async () => {
    const { messages } = await check({
      trajetoria: 'x',
      atividades: 'a'.repeat(2001),
    });
    expect(messages).toContain('Atividades deve ter no máximo 2000 caracteres');
  });

  it.each([123, true, { $ne: null }, ['a']])(
    'recusa trajetória que não é texto (%j)',
    async (trajetoria) => {
      const { messages } = await check({ trajetoria });
      expect(messages.length).toBeGreaterThan(0);
    },
  );

  it.each([
    ['com máscara', '(61) 99999-0000'],
    ['curto', '123'],
    ['letras', 'abcdefghij'],
    ['longo', '619999900001234'],
  ])('recusa telefone %s', async (_nome, telefone) => {
    const { messages } = await check({ trajetoria: 'x', telefone });
    expect(messages).toContain(
      'Telefone deve ter DDD e número, apenas dígitos (10 ou 11)',
    );
  });

  it.each(['6133334444', '61999990000'])(
    'aceita telefone %s',
    async (telefone) => {
      const { messages } = await check({ trajetoria: 'x', telefone });
      expect(messages).toEqual([]);
    },
  );

  it('telefone em branco equivale a não informar', async () => {
    const { dto, messages } = await check({ trajetoria: 'x', telefone: '' });
    expect(messages).toEqual([]);
    expect(dto.telefone).toBeUndefined();
  });

  it('telefone null é aceito: é o pedido explícito de remover o telefone', async () => {
    const { dto, messages } = await check({ trajetoria: 'x', telefone: null });
    expect(messages).toEqual([]);
    expect(dto.telefone).toBeNull();
  });

  it.each([61999990000, { $ne: null }, ['61999990000']])(
    'telefone que não é texto de dígitos (%j) é recusado, não apaga o cadastrado',
    async (telefone) => {
      const { messages } = await check({ trajetoria: 'x', telefone });
      expect(messages).toContain(
        'Telefone deve ter DDD e número, apenas dígitos (10 ou 11)',
      );
    },
  );

  it('trajetória só com caracteres invisíveis é tratada como vazia', async () => {
    const { messages } = await check({
      trajetoria: String.fromCodePoint(0x200b, 0x200b),
    });
    expect(messages).toContain('Trajetória é obrigatória');
  });

  it.each(['sim', 1, 'true', null])(
    'telefonePublico deve ser booleano (%j)',
    async (telefonePublico) => {
      const { messages } = await check({ trajetoria: 'x', telefonePublico });
      expect(messages).toContain(
        'telefonePublico deve ser verdadeiro ou falso',
      );
    },
  );

  it('recusa campos fora do contrato (perfil, e-mail, id...)', async () => {
    const { messages } = await check({
      trajetoria: 'x',
      perfil: 'ADMINISTRADOR',
      id: '1',
    });
    expect(messages.length).toBeGreaterThan(0);
  });
});
