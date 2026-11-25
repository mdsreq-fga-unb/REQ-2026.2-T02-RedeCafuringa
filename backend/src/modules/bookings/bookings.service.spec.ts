import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { MailService } from '../../common/mail/mail.service.js';
import type { MetricsRegistry } from '../metrics/metrics.registry.js';
import type { Experience } from '../experiences/schemas/experience.schema.js';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { BookingsService } from './bookings.service.js';
import { BookingStatus, PaymentMethod } from './domain/booking.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type { Booking } from './schemas/booking.schema.js';

// 21/11/2026 10:30 em Brasília (UTC-3).
const NOW = new Date('2026-11-21T13:30:00.000Z');
const CREATED_AT = new Date('2026-11-21T13:30:05.000Z');

function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

const consumerId = new Types.ObjectId().toHexString();
const producerId = new Types.ObjectId();
const experienceId = new Types.ObjectId();

const dto = {
  experienciaId: experienceId.toHexString(),
  data: '2026-12-10',
  horario: '09:00',
  participantes: 4,
  formaPagamento: PaymentMethod.PIX,
  mensagem: 'Vamos com duas crianças.',
} satisfies CreateBookingDto;

const receivedBooking = {
  ...dto,
  _id: new Types.ObjectId(),
  consumidor: new Types.ObjectId(consumerId),
  produtor: producerId,
  experiencia: experienceId,
  status: BookingStatus.PENDENTE,
  criadoEm: CREATED_AT,
};

function setup() {
  const bookings = {
    findById: vi.fn().mockReturnValue(query(receivedBooking)),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(async (doc: Record<string, unknown>) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        status: BookingStatus.PENDENTE,
        criadoEm: CREATED_AT,
        ...doc,
      }),
    })),
  };
  const experiences = {
    find: vi
      .fn()
      .mockReturnValue(
        query([{ _id: experienceId, nome: 'Trilha', valorCentavos: 4550 }]),
      ),
    findById: vi
      .fn()
      .mockReturnValue(query({ nome: 'Trilha', valorCentavos: 4550 })),
    findOne: vi
      .fn()
      .mockReturnValue(query({ _id: experienceId, produtor: producerId })),
  };
  const users = {
    find: vi.fn().mockReturnValue(query([{ _id: consumerId, nome: 'Maria' }])),
    findById: vi.fn((id: Types.ObjectId) =>
      query({
        email: id.equals(producerId)
          ? 'produtor@example.test'
          : 'consumidor@example.test',
      }),
    ),
    findOne: vi.fn().mockReturnValue(query({ _id: producerId })),
  };
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const config = {
    get: vi.fn<(key: string) => string>((key) =>
      key === 'APP_PUBLIC_URL' ? 'https://app.example.test' : '0',
    ),
  };
  const metrics = { recordMailFailure: vi.fn() };
  const service = new BookingsService(
    bookings as unknown as Model<Booking>,
    experiences as unknown as Model<Experience>,
    users as unknown as Model<User>,
    mail as unknown as MailService,
    config as unknown as ConfigService,
    metrics as unknown as MetricsRegistry,
  );
  return { service, bookings, experiences, users, mail, config, metrics };
}

describe('BookingsService (HU44/RF44)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('CA05, RN19: registra a solicitação pendente do consumidor, ligada à experiência e ao produtor', async () => {
      const { service, bookings } = setup();

      await service.create(consumerId, dto);

      expect(bookings.create).toHaveBeenCalledTimes(1);
      const [saved] = bookings.create.mock.calls[0];
      expect(String(saved.consumidor)).toBe(consumerId);
      expect(String(saved.experiencia)).toBe(experienceId.toHexString());
      expect(String(saved.produtor)).toBe(producerId.toHexString());
      expect(saved).toMatchObject({
        data: '2026-12-10',
        horario: '09:00',
        participantes: 4,
        formaPagamento: PaymentMethod.PIX,
        mensagem: 'Vamos com duas crianças.',
        status: BookingStatus.PENDENTE,
      });
    });

    it('CA06: devolve a solicitação enviada, aguardando o produtor', async () => {
      const { service } = setup();

      const res = await service.create(consumerId, dto);

      expect(res).toEqual({
        id: expect.any(String),
        experienciaId: experienceId.toHexString(),
        data: '2026-12-10',
        horario: '09:00',
        participantes: 4,
        formaPagamento: PaymentMethod.PIX,
        mensagem: 'Vamos com duas crianças.',
        status: BookingStatus.PENDENTE,
        criadoEm: CREATED_AT.toISOString(),
      });
    });

    it('RNF11: a resposta não traz consumidor nem produtor', async () => {
      const { service } = setup();

      const res = await service.create(consumerId, dto);

      expect(res).not.toHaveProperty('consumidor');
      expect(res).not.toHaveProperty('produtor');
    });

    it('sem mensagem: não grava nem devolve o campo', async () => {
      const { service, bookings } = setup();
      const { mensagem: _mensagem, ...semMensagem } = dto;

      const res = await service.create(consumerId, semMensagem);

      expect(bookings.create.mock.calls[0][0]).not.toHaveProperty('mensagem');
      expect(res).not.toHaveProperty('mensagem');
    });

    it('CA07: só aceita experiência disponível', async () => {
      const { service, experiences } = setup();

      await service.create(consumerId, dto);

      expect(experiences.findOne).toHaveBeenCalledWith({
        _id: dto.experienciaId,
        disponivel: true,
      });
    });

    it('CA07: 404 quando a experiência não existe ou está indisponível', async () => {
      const { service, experiences, bookings } = setup();
      experiences.findOne.mockReturnValue(query(null));

      await expect(service.create(consumerId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(bookings.create).not.toHaveBeenCalled();
    });

    it('CA07: 404 quando o produtor responsável não está ativo', async () => {
      const { service, users, bookings } = setup();
      users.findOne.mockReturnValue(query(null));

      await expect(service.create(consumerId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(users.findOne).toHaveBeenCalledWith({
        _id: producerId,
        perfil: Role.PRODUTOR,
        ativo: true,
      });
      expect(bookings.create).not.toHaveBeenCalled();
    });

    it('CA07: 404 sem consultar o banco quando o id não é válido', async () => {
      const { service, experiences } = setup();

      await expect(
        service.create(consumerId, { ...dto, experienciaId: 'abc' }),
      ).rejects.toThrow(NotFoundException);
      expect(experiences.findOne).not.toHaveBeenCalled();
    });

    it.each([
      ['dia anterior', '2026-11-20', '23:00'],
      ['horário de hoje que já começou', '2026-11-21', '10:00'],
    ])('CA04: 400 para %s, sem gravar', async (_caso, data, horario) => {
      const { service, bookings } = setup();

      const error = await service
        .create(consumerId, { ...dto, data, horario })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: [
          'A data e o horário da pré-reserva não podem estar no passado',
        ],
      });
      expect(bookings.create).not.toHaveBeenCalled();
    });

    it('CA04: aceita horário de hoje que ainda vai começar', async () => {
      const { service, bookings } = setup();

      await service.create(consumerId, {
        ...dto,
        data: '2026-11-21',
        horario: '11:00',
      });

      expect(bookings.create).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BookingsService (HU47/RF47)', () => {
  const id = receivedBooking._id.toHexString();
  const owner = producerId.toHexString();
  const outsider = new Types.ObjectId().toHexString();
  const acceptance = { status: BookingStatus.ACEITA } as const;
  const refusal = { status: BookingStatus.RECUSADA } as const;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('apresenta o detalhe da pré-reserva com os dados necessários à análise', async () => {
    const { service } = setup();

    await expect(service.getReceived(owner, id)).resolves.toMatchObject({
      id,
      experienciaNome: 'Trilha',
      consumidorNome: 'Maria',
      valorTotal: 182,
      status: BookingStatus.PENDENTE,
    });
  });

  it('impede que outro produtor consulte o detalhe', async () => {
    const { service } = setup();

    await expect(service.getReceived(outsider, id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('informa quando faltam dados da experiência para montar o detalhe', async () => {
    const { service, experiences } = setup();
    experiences.find.mockReturnValue(query([]));

    await expect(service.getReceived(owner, id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('retorna 404 para um ID inválido sem consultar o banco', async () => {
    const { service, bookings } = setup();

    await expect(service.getReceived(owner, 'invalido')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.respond(owner, 'invalido', refusal)).rejects.toThrow(
      NotFoundException,
    );
    expect(bookings.findById).not.toHaveBeenCalled();
    expect(bookings.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('retorna 404 para uma pré-reserva inexistente', async () => {
    const { service, bookings } = setup();
    bookings.findById.mockReturnValue(query(null));

    await expect(service.getReceived(owner, id)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.respond(owner, id, acceptance)).rejects.toThrow(
      NotFoundException,
    );
    expect(bookings.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it.each([
    [outsider, {}, ForbiddenException],
    [owner, { status: BookingStatus.CANCELADA }, ConflictException],
    [owner, { data: '2026-11-20' }, BadRequestException],
  ])(
    'rejeita aceite indevido antes de gravar (%#)',
    async (producer, fields, error) => {
      const { service, bookings } = setup();
      bookings.findById.mockReturnValue(
        query({ ...receivedBooking, ...fields }),
      );

      await expect(service.respond(producer, id, acceptance)).rejects.toThrow(
        error,
      );
      expect(bookings.findOneAndUpdate).not.toHaveBeenCalled();
    },
  );

  it.each([
    [owner, null, NotFoundException],
    [outsider, receivedBooking, ForbiddenException],
    [
      owner,
      { ...receivedBooking, status: BookingStatus.CANCELADA },
      ConflictException,
    ],
  ])(
    'informa a causa quando a escrita condicional não encontra a pré-reserva (%#)',
    async (producer, current, error) => {
      const { service, bookings, mail } = setup();
      bookings.findOneAndUpdate.mockReturnValue(query(null));
      bookings.findById.mockReturnValue(query(current));

      await expect(service.respond(producer, id, refusal)).rejects.toThrow(
        error,
      );
      expect(mail.send).not.toHaveBeenCalled();
    },
  );

  it('grava o aceite com mensagem e notifica as duas partes', async () => {
    const { service, bookings, mail, metrics } = setup();
    const mensagemResposta = 'Esperamos vocês!';
    const answer = { ...acceptance, mensagemResposta };
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, ...answer }),
    );

    await expect(service.respond(owner, id, answer)).resolves.toMatchObject(
      answer,
    );
    await service.beforeApplicationShutdown();

    expect(bookings.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: id,
        produtor: { $in: [producerId, owner] },
        status: BookingStatus.PENDENTE,
      },
      {
        $set: {
          ...answer,
          pagamento: expect.objectContaining({
            situacao: 'aguardando-sinal',
          }) as unknown,
        },
      },
      { returnDocument: 'after', runValidators: true },
    );
    expect(mail.send).toHaveBeenCalledTimes(2);
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'consumidor@example.test',
        text: expect.stringContaining(
          `https://app.example.test/#/reservas/${id}?origem=notificacoes`,
        ),
      }),
    );
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'produtor@example.test',
        text: expect.stringContaining('aceita'),
      }),
    );
    expect(
      mail.send.mock.calls.every(
        ([email]) => !email.text.includes(mensagemResposta),
      ),
    ).toBe(true);
    expect(metrics.recordMailFailure).not.toHaveBeenCalled();
  });

  it('HU48: comunica o cancelamento gravado e mantém o estado se o envio falhar', async () => {
    const { service, bookings, mail, metrics, config } = setup();
    config.get.mockImplementation((key) =>
      key === 'APP_PUBLIC_URL' ? 'https://app.example.test' : '',
    );
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, status: BookingStatus.CANCELADA }),
    );
    mail.send.mockRejectedValueOnce(new Error('SMTP indisponível'));

    await expect(
      service.cancel(receivedBooking.consumidor.toString(), id),
    ).resolves.toMatchObject({
      status: BookingStatus.CANCELADA,
    });
    await service.beforeApplicationShutdown();

    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'consumidor@example.test',
        text: expect.stringContaining('cancelada'),
      }),
    );
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'produtor@example.test',
        text: expect.stringContaining(
          `https://app.example.test/#/reservas/${id}?origem=notificacoes&perfil=producer`,
        ),
      }),
    );
    expect(metrics.recordMailFailure).toHaveBeenCalledExactlyOnceWith(
      'booking_cancellation',
    );
  });

  it('confirma a recusa sem mensagem mesmo quando o envio falha', async () => {
    const { service, bookings, mail, metrics } = setup();
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, ...refusal }),
    );
    mail.send.mockRejectedValue(new Error('SMTP indisponível'));

    const result = await service.respond(owner, id, refusal);
    await service.beforeApplicationShutdown();

    expect(result.status).toBe(BookingStatus.RECUSADA);
    expect(result).not.toHaveProperty('mensagemResposta');
    expect(bookings.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { $set: refusal, $unset: { mensagemResposta: 1 } },
      expect.anything(),
    );
    expect(metrics.recordMailFailure).toHaveBeenCalledTimes(2);
    expect(metrics.recordMailFailure).toHaveBeenCalledWith('booking_response');
  });

  it('preserva a resposta gravada quando faltam dados para preparar as notificações', async () => {
    const { service, bookings, users, mail } = setup();
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, ...refusal }),
    );
    users.findById.mockReturnValue(query(null));

    await expect(service.respond(owner, id, refusal)).resolves.toMatchObject(
      refusal,
    );
    await service.beforeApplicationShutdown();

    expect(mail.send).not.toHaveBeenCalled();
  });
});

describe('BookingsService (HU48/RF48) — link do e-mail', () => {
  const id = receivedBooking._id.toHexString();
  const owner = producerId.toHexString();
  const acceptance = { status: BookingStatus.ACEITA } as const;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function acceptWith(appUrl: string) {
    const ctx = setup();
    ctx.config.get.mockImplementation((key) =>
      key === 'APP_PUBLIC_URL' ? appUrl : '0',
    );
    ctx.bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, ...acceptance }),
    );
    await ctx.service.respond(owner, id, acceptance);
    await ctx.service.beforeApplicationShutdown();
    return ctx;
  }

  it('CA05: mantém o caminho publicado de APP_PUBLIC_URL no link de cada envolvido', async () => {
    const { mail } = await acceptWith('https://cafuringa.example.test/app/');

    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'consumidor@example.test',
        text: expect.stringContaining(
          `https://cafuringa.example.test/app/#/reservas/${id}?origem=notificacoes`,
        ),
      }),
    );
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'produtor@example.test',
        text: expect.stringContaining(
          `https://cafuringa.example.test/app/#/reservas/${id}?origem=notificacoes&perfil=producer`,
        ),
      }),
    );
  });

  it.each(['não é uma url', 'http://cafuringa.example.test'])(
    'CA02, CA07: envia o aviso sem link quando APP_PUBLIC_URL é inválida ou insegura (%s)',
    async (appUrl) => {
      const { mail, metrics } = await acceptWith(appUrl);

      expect(mail.send).toHaveBeenCalledTimes(2);
      for (const [message] of mail.send.mock.calls) {
        expect(message.text).not.toContain('Consultar pré-reserva');
      }
      expect(metrics.recordMailFailure).not.toHaveBeenCalled();
    },
  );
});

describe('BookingsService — pagamento no aceite (Pix)', () => {
  const id = receivedBooking._id.toHexString();
  const owner = producerId.toHexString();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function updateOf(bookings: { findOneAndUpdate: ReturnType<typeof vi.fn> }) {
    return bookings.findOneAndUpdate.mock.calls[0][1] as {
      $set: Record<string, unknown>;
    };
  }

  it('congela o preço e abre o prazo de 24 horas para o sinal de 50%', async () => {
    const { service, bookings, experiences } = setup();
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, status: BookingStatus.ACEITA }),
    );

    await service.respond(owner, id, { status: BookingStatus.ACEITA });
    await service.beforeApplicationShutdown();

    expect(experiences.findById).toHaveBeenCalledWith(experienceId);
    expect(updateOf(bookings).$set.pagamento).toEqual({
      valorPorPessoaCentavos: 4550,
      totalCentavos: 18200,
      sinalCentavos: 9100,
      restanteCentavos: 9100,
      situacao: 'aguardando-sinal',
      aceitaEm: NOW,
      prazoSinal: new Date('2026-11-22T13:30:00.000Z'),
    });
  });

  it('experiência gratuita: o sinal fica dispensado e não há prazo', async () => {
    const { service, bookings, experiences } = setup();
    experiences.findById.mockReturnValue(
      query({ nome: 'Trilha', valorCentavos: 0 }),
    );
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, status: BookingStatus.ACEITA }),
    );

    await service.respond(owner, id, { status: BookingStatus.ACEITA });
    await service.beforeApplicationShutdown();

    expect(updateOf(bookings).$set.pagamento).toEqual({
      valorPorPessoaCentavos: 0,
      totalCentavos: 0,
      sinalCentavos: 0,
      restanteCentavos: 0,
      situacao: 'dispensado',
      aceitaEm: NOW,
    });
  });

  it('experiência que não existe mais: aceita sem montar o pagamento', async () => {
    const { service, bookings, experiences } = setup();
    experiences.findById.mockReturnValue(query(null));
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, status: BookingStatus.ACEITA }),
    );

    await service.respond(owner, id, { status: BookingStatus.ACEITA });
    await service.beforeApplicationShutdown();

    expect(updateOf(bookings).$set).not.toHaveProperty('pagamento');
  });

  it('a recusa não cria pagamento', async () => {
    const { service, bookings } = setup();
    bookings.findOneAndUpdate.mockReturnValue(
      query({ ...receivedBooking, status: BookingStatus.RECUSADA }),
    );

    await service.respond(owner, id, { status: BookingStatus.RECUSADA });
    await service.beforeApplicationShutdown();

    expect(updateOf(bookings).$set).not.toHaveProperty('pagamento');
  });
});
