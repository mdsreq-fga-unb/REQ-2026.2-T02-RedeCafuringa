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

describe('trajetória — chave Pix da produtora', () => {
  const pix = {
    tipo: 'telefone',
    chave: '(61) 99999-8888',
    nomeRecebedor: 'Maria da Silva',
    publico: true,
  };

  it('omitida, é válida e não muda o Pix salvo', async () => {
    const { dto, messages } = await check({ trajetoria: 'Minha história' });

    expect(messages).toEqual([]);
    expect(dto.pix).toBeUndefined();
  });

  it('aceita a chave com o tipo, o nome do recebedor e a autorização', async () => {
    const { messages } = await check({ trajetoria: 'Minha história', pix });

    expect(messages).toEqual([]);
  });

  it('null é o pedido explícito de remover o Pix', async () => {
    const { dto, messages } = await check({
      trajetoria: 'Minha história',
      pix: null,
    });

    expect(messages).toEqual([]);
    expect(dto.pix).toBeNull();
  });

  it('sem a autorização, o Pix fica privado', async () => {
    const { publico: _publico, ...semAutorizacao } = pix;
    const { messages } = await check({
      trajetoria: 'Minha história',
      pix: semAutorizacao,
    });

    expect(messages).toEqual([]);
  });

  /** Mensagens do próprio campo e do objeto aninhado (`children`). */
  async function pixMessages(override: Record<string, unknown>) {
    const dto = plainToInstance(SaveTrajectoryDto, {
      trajetoria: 'Minha história',
      pix: { ...pix, ...override },
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    return errors.flatMap((e) => [
      ...Object.values(e.constraints ?? {}),
      ...(e.children ?? []).flatMap((c) => Object.values(c.constraints ?? {})),
    ]);
  }

  it.each([
    [
      'tipo desconhecido',
      { tipo: 'boleto' },
      'Tipo da chave Pix deve ser cpf, cnpj, telefone, email ou aleatoria',
    ],
    [
      'chave que não combina com o tipo',
      { tipo: 'cpf', chave: '(61) 99999-8888' },
      'Chave Pix inválida para o tipo escolhido',
    ],
    ['chave vazia', { chave: '' }, 'Chave Pix inválida para o tipo escolhido'],
    [
      'sem o nome do recebedor',
      { nomeRecebedor: '  ' },
      'Informe o nome de quem recebe o Pix, como aparece no banco',
    ],
    [
      'nome do recebedor longo demais',
      { nomeRecebedor: 'a'.repeat(61) },
      'Nome do recebedor deve ter no máximo 60 caracteres',
    ],
    [
      'autorização que não é verdadeiro ou falso',
      { publico: 'sim' },
      'pix.publico deve ser verdadeiro ou falso',
    ],
  ])('recusa %s', async (_caso, override, message) => {
    expect(await pixMessages(override)).toEqual([message]);
  });

  it('recusa Pix que não é um objeto', async () => {
    const { messages } = await check({
      trajetoria: 'Minha história',
      pix: 'maria@exemplo.com',
    });

    expect(messages).toEqual([
      'Pix deve ter o tipo, a chave e o nome do recebedor',
    ]);
  });

  it('recusa campo fora do contrato dentro do Pix', async () => {
    expect(await pixMessages({ banco: '001' })).toEqual([
      'property banco should not exist',
    ]);
  });
});

describe('trajetória — link de vídeo do YouTube', () => {
  const LINK = 'https://youtu.be/dQw4w9WgXcQ';
  const VIDEO_URL_ERROR =
    'Cole um link de vídeo do YouTube, como https://www.youtube.com/watch?v=…';

  it('omitido, é válido e não muda o vídeo salvo', async () => {
    const { dto, messages } = await check({ trajetoria: 'Minha história' });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBeUndefined();
  });

  it('aceita o link', async () => {
    const { dto, messages } = await check({
      trajetoria: 'Minha história',
      videoUrl: ` ${LINK} `,
    });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBe(LINK);
  });

  it('null é o pedido explícito de remover o vídeo', async () => {
    const { dto, messages } = await check({
      trajetoria: 'Minha história',
      videoUrl: null,
    });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBeNull();
  });

  it('em branco equivale a não informar', async () => {
    const { dto, messages } = await check({
      trajetoria: 'Minha história',
      videoUrl: '',
    });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBeUndefined();
  });

  it.each(['https://vimeo.com/123', 42, true])(
    'recusa %j com a orientação',
    async (videoUrl) => {
      expect(
        (await check({ trajetoria: 'Minha história', videoUrl })).messages,
      ).toEqual([VIDEO_URL_ERROR]);
    },
  );
});
