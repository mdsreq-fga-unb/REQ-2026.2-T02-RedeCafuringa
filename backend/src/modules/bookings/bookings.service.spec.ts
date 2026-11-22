import { BadRequestException, NotFoundException } from '@nestjs/common';
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

function setup() {
  const bookings = {
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
    findOne: vi
      .fn()
      .mockReturnValue(query({ _id: experienceId, produtor: producerId })),
  };
  const users = {
    findOne: vi.fn().mockReturnValue(query({ _id: producerId })),
  };
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const config = { get: vi.fn().mockReturnValue('') };
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
