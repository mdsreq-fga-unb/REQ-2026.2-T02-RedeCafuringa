import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { Experience } from '../experiences/schemas/experience.schema.js';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { BookingsQueryService } from './bookings-query.service.js';
import {
  BookingStatus,
  PaymentMethod,
  UNKNOWN_EXPERIENCE_NAME,
} from './domain/booking.js';
import {
  NOTIFIABLE_BOOKING_STATUSES,
  NOTIFICATIONS_LIMIT,
} from './dto/booking-notification.response.js';
import type { Booking } from './schemas/booking.schema.js';

const CREATED_AT = new Date('2026-11-21T13:30:05.000Z');
const UPDATED_AT = new Date('2026-11-21T15:00:00.000Z');

const consumerId = new Types.ObjectId();
const producerId = new Types.ObjectId();
const experienceId = new Types.ObjectId();
const photoId = new Types.ObjectId();

type Row = Record<string, unknown>;

/** Linha como volta do `$lookup` do service: reserva + experiência + outro lado. */
function row(overrides: Row = {}): Row {
  return {
    _id: new Types.ObjectId(),
    consumidor: consumerId,
    experiencia: experienceId,
    produtor: producerId,
    data: '2026-12-10',
    horario: '09:00',
    participantes: 4,
    formaPagamento: PaymentMethod.PIX,
    mensagem: 'Vamos com duas crianças.',
    status: BookingStatus.PENDENTE,
    criadoEm: CREATED_AT,
    atualizadoEm: UPDATED_AT,
    experienciaDados: {
      nome: 'Trilha guiada da nascente',
      local: 'Sítio Boa Vista',
      valorCentavos: 4550,
      disponivel: true,
      fotos: [{ id: photoId, versao: 'v1' }],
    },
    outroLado: { nome: 'Maria da Silva', nomeIniciativa: 'Sítio Raízes' },
    ...overrides,
  };
}

function exec<T>(value: T) {
  return { exec: vi.fn().mockResolvedValue(value) };
}

function setup(rows: Row[] = [row()], total = rows.length) {
  const bookings = {
    aggregate: vi.fn().mockReturnValue(exec(rows)),
    countDocuments: vi.fn().mockReturnValue(exec(total)),
  };
  const experiences = { collection: { name: 'experiences' } };
  const users = { collection: { name: 'users' } };
  const service = new BookingsQueryService(
    bookings as unknown as Model<Booking>,
    experiences as unknown as Model<Experience>,
    users as unknown as Model<User>,
  );
  return { service, bookings };
}

const pipelineOf = (bookings: { aggregate: ReturnType<typeof vi.fn> }) =>
  bookings.aggregate.mock.calls[0][0] as Array<Record<string, unknown>>;

describe('BookingsQueryService (HU45/RF45)', () => {
  describe('listMine — consumidor (CA02)', () => {
    it('filtra pelo consumidor do token, com ObjectId, e ordena da mais nova à mais antiga', async () => {
      const { service, bookings } = setup();

      await service.listMine(consumerId.toHexString(), {});

      const [match, sort] = pipelineOf(bookings);
      expect(match).toEqual({ $match: { consumidor: consumerId } });
      expect((match.$match as Row).consumidor).toBeInstanceOf(Types.ObjectId);
      expect(sort).toEqual({ $sort: { criadoEm: -1, _id: -1 } });
    });

    it('pagina com os valores padrão (página 1, 20 por página)', async () => {
      const { service, bookings } = setup();

      const res = await service.listMine(consumerId.toHexString(), {});

      const pipeline = pipelineOf(bookings);
      expect(pipeline).toContainEqual({ $skip: 0 });
      expect(pipeline).toContainEqual({ $limit: 20 });
      expect(res).toMatchObject({ pagina: 1, limite: 20 });
    });

    it('calcula o salto da página pedida', async () => {
      const { service, bookings } = setup();

      await service.listMine(consumerId.toHexString(), {
        pagina: 3,
        limite: 10,
      });

      const pipeline = pipelineOf(bookings);
      expect(pipeline).toContainEqual({ $skip: 20 });
      expect(pipeline).toContainEqual({ $limit: 10 });
    });

    it('filtra pela situação e conta com o mesmo filtro', async () => {
      const { service, bookings } = setup();

      await service.listMine(consumerId.toHexString(), {
        status: BookingStatus.ACEITA,
      });

      const filter = { consumidor: consumerId, status: BookingStatus.ACEITA };
      expect(pipelineOf(bookings)[0]).toEqual({ $match: filter });
      expect(bookings.countDocuments).toHaveBeenCalledWith(filter);
    });

    it('CA06: sem solicitações devolve lista vazia, não erro', async () => {
      const { service } = setup([], 0);

      const res = await service.listMine(consumerId.toHexString(), {});

      expect(res).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });

    it('CA04: apresenta os dados da solicitação, a experiência e o produtor', async () => {
      const { service } = setup();

      const { itens, total } = await service.listMine(
        consumerId.toHexString(),
        {},
      );

      expect(total).toBe(1);
      expect(itens[0]).toEqual({
        id: expect.any(String),
        experienciaId: experienceId.toHexString(),
        data: '2026-12-10',
        horario: '09:00',
        participantes: 4,
        formaPagamento: PaymentMethod.PIX,
        mensagem: 'Vamos com duas crianças.',
        status: BookingStatus.PENDENTE,
        criadoEm: CREATED_AT.toISOString(),
        atualizadoEm: UPDATED_AT.toISOString(),
        experiencia: {
          nome: 'Trilha guiada da nascente',
          local: 'Sítio Boa Vista',
          valorPorPessoa: 45.5,
          disponivel: true,
          foto: `/experiences/${experienceId.toHexString()}/photos/${photoId.toHexString()}?v=v1`,
        },
        contraparte: {
          id: producerId.toHexString(),
          nome: 'Sítio Raízes',
        },
      });
    });

    it('CA07: devolve a situação que está gravada', async () => {
      const { service } = setup([row({ status: BookingStatus.RECUSADA })]);

      const { itens } = await service.listMine(consumerId.toHexString(), {});

      expect(itens[0].status).toBe(BookingStatus.RECUSADA);
    });

    it('sem mensagem: o campo não aparece', async () => {
      const { service } = setup([row({ mensagem: undefined })]);

      const { itens } = await service.listMine(consumerId.toHexString(), {});

      expect(itens[0]).not.toHaveProperty('mensagem');
    });

    it('produtor sem nome de iniciativa: usa o nome da conta', async () => {
      const { service } = setup([row({ outroLado: { nome: 'José Pereira' } })]);

      const { itens } = await service.listMine(consumerId.toHexString(), {});

      expect(itens[0].contraparte.nome).toBe('José Pereira');
    });

    it('experiência fora da oferta: segue consultável, sem foto pública', async () => {
      const { service } = setup([
        row({
          experienciaDados: {
            nome: 'Trilha guiada da nascente',
            local: 'Sítio Boa Vista',
            valorCentavos: 4550,
            disponivel: false,
            fotos: [{ id: photoId, versao: 'v1' }],
          },
        }),
      ]);

      const { itens } = await service.listMine(consumerId.toHexString(), {});

      expect(itens[0].experiencia.disponivel).toBe(false);
      expect(itens[0].experiencia).not.toHaveProperty('foto');
    });

    it('RNF11: não devolve e-mail, telefone, documentos nem os ids crus', async () => {
      const { service } = setup([
        row({
          outroLado: {
            nome: 'Maria da Silva',
            email: 'maria@example.com',
            telefone: '61999990000',
            cpfHash: 'x',
          },
        }),
      ]);

      const { itens } = await service.listMine(consumerId.toHexString(), {});

      const json = JSON.stringify(itens[0]);
      expect(json).not.toMatch(/maria@example|61999990000|cpf|email|telefone/i);
      expect(itens[0]).not.toHaveProperty('consumidor');
      expect(itens[0]).not.toHaveProperty('produtor');
    });
  });

  describe('listReceived — produtor (CA03)', () => {
    it('filtra pelo produtor do token e mostra o consumidor como contraparte', async () => {
      const { service, bookings } = setup([
        row({ outroLado: { nome: 'Maria da Silva' } }),
      ]);

      const { itens } = await service.listReceived(
        producerId.toHexString(),
        {},
      );

      expect(pipelineOf(bookings)[0]).toEqual({
        $match: { produtor: { $in: [producerId, producerId.toHexString()] } },
      });
      expect(itens[0].contraparte).toEqual({
        id: consumerId.toHexString(),
        nome: 'Maria da Silva',
      });
    });

    it('filtra pela situação', async () => {
      const { service, bookings } = setup();

      await service.listReceived(producerId.toHexString(), {
        status: BookingStatus.PENDENTE,
      });

      expect(pipelineOf(bookings)[0]).toEqual({
        $match: {
          produtor: { $in: [producerId, producerId.toHexString()] },
          status: BookingStatus.PENDENTE,
        },
      });
    });

    it('CA06: sem solicitações recebidas devolve lista vazia', async () => {
      const { service } = setup([], 0);

      const res = await service.listReceived(producerId.toHexString(), {});

      expect(res.itens).toEqual([]);
      expect(res.total).toBe(0);
    });
  });

  describe('findOne — detalhe (CA04, CA05)', () => {
    it('consumidor vê a própria solicitação: filtra por id e consumidor', async () => {
      const booking = row();
      const { service, bookings } = setup([booking]);

      const res = await service.findOne(
        { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR },
        String(booking._id),
      );

      expect(pipelineOf(bookings)[0]).toEqual({
        $match: { _id: booking._id, consumidor: consumerId },
      });
      expect(res.id).toBe(String(booking._id));
      expect(res.contraparte.nome).toBe('Sítio Raízes');
    });

    it('produtor vê só a solicitação recebida: filtra por id e produtor', async () => {
      const booking = row();
      const { service, bookings } = setup([booking]);

      await service.findOne(
        { id: producerId.toHexString(), perfil: Role.PRODUTOR },
        String(booking._id),
      );

      expect(pipelineOf(bookings)[0]).toEqual({
        $match: {
          _id: booking._id,
          produtor: { $in: [producerId, producerId.toHexString()] },
        },
      });
    });

    it('CA05: registro de terceiros dá 404, igual ao que não existe', async () => {
      const { service } = setup([]);

      await expect(
        service.findOne(
          { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR },
          new Types.ObjectId().toHexString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('id que não é ObjectId dá 404 sem consultar o banco', async () => {
      const { service, bookings } = setup();

      await expect(
        service.findOne(
          { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR },
          'abc',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(bookings.aggregate).not.toHaveBeenCalled();
    });

    it('perfil sem consulta própria (administrador) dá 404 sem consultar o banco', async () => {
      const { service, bookings } = setup();

      await expect(
        service.findOne(
          {
            id: new Types.ObjectId().toHexString(),
            perfil: Role.ADMINISTRADOR,
          },
          new Types.ObjectId().toHexString(),
        ),
      ).rejects.toThrow(NotFoundException);
      expect(bookings.aggregate).not.toHaveBeenCalled();
    });

    it('HU47: mostra a mensagem da resposta do produtor quando houver', async () => {
      const booking = row({
        status: BookingStatus.ACEITA,
        mensagemResposta: 'Esperamos vocês!',
      });
      const { service } = setup([booking]);

      const res = await service.findOne(
        { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR },
        String(booking._id),
      );

      expect(res.mensagemResposta).toBe('Esperamos vocês!');
    });

    it('HU47: sem resposta do produtor, o campo não aparece', async () => {
      const booking = row();
      const { service } = setup([booking]);

      const res = await service.findOne(
        { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR },
        String(booking._id),
      );

      expect(res).not.toHaveProperty('mensagemResposta');
    });
  });

  describe('listNotifications — alterações de situação (HU48)', () => {
    const bookingId = new Types.ObjectId('64b0c0ffee0000000000abcd');

    function notification(overrides: Row = {}): Row {
      return {
        _id: bookingId,
        data: '2026-12-10',
        horario: '09:00',
        participantes: 4,
        status: BookingStatus.ACEITA,
        experienciaNome: 'Trilha guiada da nascente',
        ...overrides,
      };
    }

    it('consumidor: só as próprias, nas situações notificáveis, das mais recentes, até o limite', async () => {
      const { service, bookings } = setup([notification()]);

      await service.listNotifications({
        id: consumerId.toHexString(),
        perfil: Role.CONSUMIDOR,
      });

      const [match, sort, limit, lookup] = pipelineOf(bookings);
      expect(match).toEqual({
        $match: {
          consumidor: consumerId,
          status: { $in: NOTIFIABLE_BOOKING_STATUSES },
        },
      });
      expect(sort).toEqual({ $sort: { atualizadoEm: -1, _id: -1 } });
      expect(limit).toEqual({ $limit: NOTIFICATIONS_LIMIT });
      expect(NOTIFICATIONS_LIMIT).toBe(50);
      expect(lookup).toHaveProperty('$lookup.from', 'experiences');
    });

    it('produtor: só as das experiências dele', async () => {
      const { service, bookings } = setup([notification()]);

      await service.listNotifications({
        id: producerId.toHexString(),
        perfil: Role.PRODUTOR,
      });

      expect(pipelineOf(bookings)[0]).toEqual({
        $match: {
          produtor: { $in: [producerId, producerId.toHexString()] },
          status: { $in: NOTIFIABLE_BOOKING_STATUSES },
        },
      });
    });

    it('perfil sem pré-reservas (administrador) devolve lista vazia sem consultar o banco', async () => {
      const { service, bookings } = setup();

      await expect(
        service.listNotifications({
          id: new Types.ObjectId().toHexString(),
          perfil: Role.ADMINISTRADOR,
        }),
      ).resolves.toEqual([]);
      expect(bookings.aggregate).not.toHaveBeenCalled();
    });

    it('monta cada notificação com id da alteração, código e dados da reserva', async () => {
      const { service } = setup([
        notification({ status: BookingStatus.RECUSADA }),
      ]);

      const [item] = await service.listNotifications({
        id: consumerId.toHexString(),
        perfil: Role.CONSUMIDOR,
      });

      expect(item).toEqual({
        id: '64b0c0ffee0000000000abcd:recusada',
        reservaId: '64b0c0ffee0000000000abcd',
        codigo: 'CAF-00ABCD',
        experienciaNome: 'Trilha guiada da nascente',
        data: '2026-12-10',
        horario: '09:00',
        participantes: 4,
        status: BookingStatus.RECUSADA,
      });
    });

    it('experiência que não existe mais aparece com o nome padrão', async () => {
      const semExperiencia = notification();
      delete semExperiencia.experienciaNome;
      const { service } = setup([semExperiencia]);

      const [item] = await service.listNotifications({
        id: consumerId.toHexString(),
        perfil: Role.CONSUMIDOR,
      });

      expect(item.experienciaNome).toBe(UNKNOWN_EXPERIENCE_NAME);
    });

    it('sem alterações, devolve lista vazia', async () => {
      const { service } = setup([]);

      await expect(
        service.listNotifications({
          id: consumerId.toHexString(),
          perfil: Role.CONSUMIDOR,
        }),
      ).resolves.toEqual([]);
    });
  });
});

describe('BookingsQueryService — pagamento e Pix no detalhe', () => {
  const PRAZO = new Date('2026-11-22T13:30:00.000Z');
  const consumer = { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR };
  const producer = { id: producerId.toHexString(), perfil: Role.PRODUTOR };

  const pagamento = {
    valorPorPessoaCentavos: 4550,
    totalCentavos: 18200,
    sinalCentavos: 9100,
    restanteCentavos: 9100,
    situacao: 'aguardando-sinal',
    aceitaEm: new Date('2026-11-21T13:30:00.000Z'),
    prazoSinal: PRAZO,
  };
  const pixProdutora = {
    pixChave: '+5561999998888',
    pixRecebedor: 'Maria da Silva',
    pixPublico: true,
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-22T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const accepted = (overrides: Row = {}) =>
    row({
      status: BookingStatus.ACEITA,
      pagamento,
      pixProdutora,
      ...overrides,
    });

  it('mostra o sinal, o restante e o prazo, em reais', async () => {
    const booking = accepted();
    const { service } = setup([booking]);

    const res = await service.findOne(consumer, String(booking._id));

    expect(res.pagamento).toEqual({
      total: 182,
      sinal: 91,
      restante: 91,
      situacao: 'aguardando-sinal',
      prazoSinal: PRAZO.toISOString(),
    });
  });

  it('a consumidora que precisa pagar recebe o Pix da produtora para o sinal', async () => {
    const booking = accepted();
    const { service } = setup([booking]);

    const res = await service.findOne(consumer, String(booking._id));

    expect(res.pix).toEqual({
      chave: '+5561999998888',
      nomeRecebedor: 'Maria da Silva',
      cidade: 'BRASILIA',
      txid: String(booking._id),
    });
  });

  it('o Pix da produtora é buscado só no detalhe da consumidora, com só esses campos', async () => {
    const booking = accepted();
    const { service, bookings } = setup([booking]);

    await service.findOne(consumer, String(booking._id));

    expect(JSON.stringify(pipelineOf(bookings))).toContain(
      '{"$project":{"_id":0,"pixChave":1,"pixRecebedor":1,"pixPublico":1}}',
    );
  });

  it('prazo vencido: aparece expirado e sem Pix', async () => {
    vi.setSystemTime(new Date('2026-11-22T13:30:01.000Z'));
    const booking = accepted();
    const { service } = setup([booking]);

    const res = await service.findOne(consumer, String(booking._id));

    expect(res.pagamento?.situacao).toBe('expirado');
    expect(res).not.toHaveProperty('pix');
  });

  it.each([
    [
      'a produtora não autorizou',
      { pixProdutora: { ...pixProdutora, pixPublico: false } },
    ],
    ['a produtora não tem chave', { pixProdutora: {} }],
    [
      'o sinal já foi confirmado',
      { pagamento: { ...pagamento, situacao: 'sinal-confirmado' } },
    ],
    [
      'o sinal foi dispensado',
      { pagamento: { ...pagamento, situacao: 'dispensado' } },
    ],
    ['a pré-reserva foi cancelada', { status: BookingStatus.CANCELADA }],
  ])('sem Pix quando %s', async (_caso, overrides) => {
    const booking = accepted(overrides);
    const { service } = setup([booking]);

    expect(
      await service.findOne(consumer, String(booking._id)),
    ).not.toHaveProperty('pix');
  });

  it('a produtora vê o pagamento, mas não recebe a própria chave no detalhe', async () => {
    const booking = accepted();
    const { service, bookings } = setup([booking]);

    const res = await service.findOne(producer, String(booking._id));

    expect(res.pagamento?.sinal).toBe(91);
    expect(res).not.toHaveProperty('pix');
    expect(JSON.stringify(pipelineOf(bookings))).not.toContain('pixChave');
  });

  it('pré-reserva sem pagamento (pendente ou antiga) não traz o campo', async () => {
    const booking = row();
    const { service } = setup([booking]);

    expect(
      await service.findOne(consumer, String(booking._id)),
    ).not.toHaveProperty('pagamento');
  });

  it('as listas trazem o pagamento, mas nunca o Pix', async () => {
    const { service } = setup([accepted()]);

    const res = await service.listMine(consumer.id, {});

    expect(res.itens[0].pagamento?.situacao).toBe('aguardando-sinal');
    expect(res.itens[0]).not.toHaveProperty('pix');
  });
});

describe('BookingsQueryService — notificações do sinal por Pix', () => {
  const bookingId = new Types.ObjectId('64b0c0ffee0000000000abcd');
  const consumer = { id: consumerId.toHexString(), perfil: Role.CONSUMIDOR };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-22T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function notification(overrides: Row = {}): Row {
    return {
      _id: bookingId,
      data: '2026-12-10',
      horario: '09:00',
      participantes: 4,
      status: BookingStatus.ACEITA,
      experienciaNome: 'Trilha',
      ...overrides,
    };
  }

  it('lê do banco a situação do sinal e a devolução', async () => {
    const { service, bookings } = setup([notification()]);

    await service.listNotifications(consumer);

    const project = pipelineOf(bookings).at(-1) as {
      $project: Record<string, unknown>;
    };
    expect(project.$project).toMatchObject({
      'pagamento.situacao': 1,
      'pagamento.prazoSinal': 1,
      'pagamento.sinalNoCancelamento': 1,
      'pagamento.devolvidoEm': 1,
    });
  });

  it('cada mudança do sinal vira uma notificação nova (o id muda)', async () => {
    const { service } = setup([
      notification({
        pagamento: {
          situacao: 'comprovante-enviado',
          prazoSinal: new Date('2026-11-22T13:30:00.000Z'),
        },
      }),
    ]);

    const [item] = await service.listNotifications(consumer);

    expect(item.id).toBe('64b0c0ffee0000000000abcd:aceita:comprovante-enviado');
    expect(item.pagamento).toBe('comprovante-enviado');
  });

  it('prazo vencido aparece como expirado', async () => {
    const { service } = setup([
      notification({
        pagamento: {
          situacao: 'aguardando-sinal',
          prazoSinal: new Date('2026-11-22T09:00:00.000Z'),
        },
      }),
    ]);

    const [item] = await service.listNotifications(consumer);

    expect(item.pagamento).toBe('expirado');
    expect(item.id).toBe('64b0c0ffee0000000000abcd:aceita:expirado');
  });

  it('cancelada com sinal a devolver avisa a devolução pendente', async () => {
    const { service } = setup([
      notification({
        status: BookingStatus.CANCELADA,
        pagamento: {
          situacao: 'sinal-confirmado',
          sinalNoCancelamento: 'devolver',
        },
      }),
    ]);

    const [item] = await service.listNotifications(consumer);

    expect(item).toMatchObject({
      id: '64b0c0ffee0000000000abcd:cancelada:sinal-confirmado:pendente',
      pagamento: 'sinal-confirmado',
      devolucao: 'pendente',
    });
  });

  it('devolução registrada vira outra notificação', async () => {
    const { service } = setup([
      notification({
        status: BookingStatus.CANCELADA,
        pagamento: {
          situacao: 'sinal-confirmado',
          sinalNoCancelamento: 'devolver',
          devolvidoEm: new Date('2026-11-21T00:00:00.000Z'),
        },
      }),
    ]);

    const [item] = await service.listNotifications(consumer);

    expect(item.devolucao).toBe('feita');
    expect(item.id).toBe(
      '64b0c0ffee0000000000abcd:cancelada:sinal-confirmado:feita',
    );
  });

  it('sem pagamento, a notificação fica como antes', async () => {
    const { service } = setup([notification()]);

    const [item] = await service.listNotifications(consumer);

    expect(item.id).toBe('64b0c0ffee0000000000abcd:aceita');
    expect(item).not.toHaveProperty('pagamento');
    expect(item).not.toHaveProperty('devolucao');
  });
});
