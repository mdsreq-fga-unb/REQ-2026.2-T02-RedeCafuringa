import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { Experience } from '../experiences/schemas/experience.schema.js';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { BookingsQueryService } from './bookings-query.service.js';
import { BookingStatus, PaymentMethod } from './domain/booking.js';
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
  });
});
