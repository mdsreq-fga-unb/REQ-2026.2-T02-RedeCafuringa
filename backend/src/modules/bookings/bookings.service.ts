import {
  BeforeApplicationShutdown,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { MailService } from '../../common/mail/mail.service.js';
import {
  parseRetryDelays,
  sendWithRetry,
} from '../../common/mail/send-with-retry.js';
import { MetricsRegistry } from '../metrics/metrics.registry.js';
import { Experience } from '../experiences/schemas/experience.schema.js';
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import {
  BookingStatus,
  INITIAL_BOOKING_STATUS,
  isBookingInPast,
} from './domain/booking.js';
import type { BookingResponse } from './dto/booking.response.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type { ReceivedBookingResponse } from './dto/received-booking.response.js';
import type { RespondBookingDto } from './dto/respond-booking.dto.js';
import { Booking } from './schemas/booking.schema.js';

const EXPERIENCE_UNAVAILABLE = 'Experiência indisponível para pré-reserva';
const IN_PAST = 'A data e o horário da pré-reserva não podem estar no passado';
const PAST_BOOKING_CANNOT_BE_ACCEPTED =
  'Não é possível aceitar uma pré-reserva com data e horário passados.';

type BookingDoc = Booking & { _id: Types.ObjectId };
type BookableExperience = { _id: Types.ObjectId; produtor: Types.ObjectId };
type ReceivedExperience = Pick<Experience, 'nome' | 'valorCentavos'> & {
  _id: Types.ObjectId;
};
type ReceivedConsumer = Pick<User, 'nome'> & { _id: Types.ObjectId };

/** HU44/RF44: solicitação de pré-reserva de experiência pelo consumidor. */
@Injectable()
export class BookingsService implements BeforeApplicationShutdown {
  private readonly logger = new Logger(BookingsService.name);
  private readonly pendingNotifications = new Set<Promise<void>>();

  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Experience.name)
    private readonly experiences: Model<Experience>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsRegistry,
  ) {}

  /**
   * Registra a solicitação do consumidor do token, pendente e ligada à
   * experiência e ao produtor responsável (CA05, RN19). Só experiências
   * visíveis no catálogo aceitam pedidos (CA07).
   */
  async create(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponse> {
    if (isBookingInPast(dto.data, dto.horario)) {
      throw new BadRequestException([IN_PAST]);
    }

    const experience = await this.bookableExperience(dto.experienciaId);
    if (!experience) throw new NotFoundException(EXPERIENCE_UNAVAILABLE);

    const created = await this.bookings.create({
      consumidor: new Types.ObjectId(userId),
      experiencia: experience._id,
      produtor: experience.produtor,
      data: dto.data,
      horario: dto.horario,
      participantes: dto.participantes,
      formaPagamento: dto.formaPagamento,
      ...(dto.mensagem ? { mensagem: dto.mensagem } : {}),
      status: INITIAL_BOOKING_STATUS,
    });
    return this.toResponse(created.toObject() as BookingDoc);
  }

  /** HU47/CA01: lista somente solicitações atribuídas ao produtor autenticado. */
  async listReceived(producerId: string): Promise<ReceivedBookingResponse[]> {
    const records = await this.bookings
      .find({ produtor: producerId })
      .sort({ criadoEm: -1, _id: -1 })
      .lean<BookingDoc[]>()
      .exec();
    return this.toReceivedResponses(records);
  }

  /** HU47/CA02 e CA05: apresenta a solicitação somente ao produtor responsável. */
  async getReceived(
    producerId: string,
    id: string,
  ): Promise<ReceivedBookingResponse> {
    if (!isObjectIdOrHexString(id)) {
      throw new NotFoundException('Pré-reserva não encontrada.');
    }

    const booking = await this.bookings.findById(id).lean<BookingDoc>().exec();
    if (!booking) throw new NotFoundException('Pré-reserva não encontrada.');
    if (booking.produtor.toString() !== producerId) {
      throw new ForbiddenException(
        'Você não tem permissão para consultar esta pré-reserva.',
      );
    }

    const [response] = await this.toReceivedResponses([booking]);
    return response;
  }

  /** HU47/CA03-CA06: transição atômica de pendente para aceite ou recusa. */
  async respond(
    producerId: string,
    id: string,
    dto: RespondBookingDto,
  ): Promise<ReceivedBookingResponse> {
    if (!isObjectIdOrHexString(id)) {
      throw new NotFoundException('Pré-reserva não encontrada.');
    }

    if (dto.status === BookingStatus.ACEITA) {
      const current = await this.bookings
        .findById(id)
        .select('produtor status data horario')
        .lean()
        .exec();
      if (!current) throw new NotFoundException('Pré-reserva não encontrada.');
      if (current.produtor.toString() !== producerId) {
        throw new ForbiddenException(
          'Você não tem permissão para responder esta pré-reserva.',
        );
      }
      if (current.status !== BookingStatus.PENDENTE) {
        throw new ConflictException(
          `Pré-reserva indisponível para resposta. Situação atual: ${current.status}.`,
        );
      }
      if (isBookingInPast(current.data, current.horario)) {
        throw new BadRequestException(PAST_BOOKING_CANNOT_BE_ACCEPTED);
      }
    }

    const updated = await this.bookings
      .findOneAndUpdate(
        {
          _id: id,
          produtor: producerId,
          status: BookingStatus.PENDENTE,
        },
        {
          $set: {
            status: dto.status,
            ...(dto.mensagemResposta
              ? { mensagemResposta: dto.mensagemResposta }
              : {}),
          },
          ...(!dto.mensagemResposta ? { $unset: { mensagemResposta: 1 } } : {}),
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<BookingDoc>()
      .exec();

    if (!updated) {
      const current = await this.bookings
        .findById(id)
        .select('produtor status')
        .lean()
        .exec();
      if (!current) throw new NotFoundException('Pré-reserva não encontrada.');
      if (current.produtor.toString() !== producerId) {
        throw new ForbiddenException(
          'Você não tem permissão para responder esta pré-reserva.',
        );
      }
      throw new ConflictException(
        `Pré-reserva indisponível para resposta. Situação atual: ${current.status}.`,
      );
    }

    const [response] = await this.toReceivedResponses([updated]);
    this.notifyResponseParticipants(updated);
    return response;
  }

  async beforeApplicationShutdown(): Promise<void> {
    await Promise.allSettled(this.pendingNotifications);
  }

  private notifyResponseParticipants(booking: BookingDoc): void {
    const task = this.sendResponseNotifications(booking)
      .catch((error: unknown) => {
        const name = error instanceof Error ? error.name : 'erro desconhecido';
        this.logger.warn(
          `Falha ao preparar notificações da pré-reserva: ${name}`,
        );
      })
      .finally(() => this.pendingNotifications.delete(task));
    this.pendingNotifications.add(task);
  }

  private async sendResponseNotifications(booking: BookingDoc): Promise<void> {
    const [consumer, producer, experience] = await Promise.all([
      this.users.findById(booking.consumidor).select('email').lean().exec(),
      this.users.findById(booking.produtor).select('email').lean().exec(),
      this.experiences
        .findById(booking.experiencia)
        .select('nome')
        .lean()
        .exec(),
    ]);
    if (!consumer || !producer || !experience) {
      throw new Error('Dados necessários à notificação não encontrados');
    }

    const accepted = booking.status === BookingStatus.ACEITA;
    const decision = accepted ? 'aceita' : 'recusada';
    const message = booking.mensagemResposta
      ? `\nMensagem do produtor: ${booking.mensagemResposta}`
      : '';
    const details = `Experiência: ${experience.nome}\nData: ${booking.data}\nHorário: ${booking.horario}`;
    const emails = [
      {
        to: consumer.email,
        subject: `Pré-reserva ${decision}: ${experience.nome}`,
        text: `Sua solicitação de pré-reserva foi ${decision}.\n${details}${message}`,
      },
      {
        to: producer.email,
        subject: `Resposta registrada: ${experience.nome}`,
        text: `Sua resposta à solicitação de pré-reserva foi registrada como ${decision}.\n${details}${message}`,
      },
    ];
    const results = await Promise.all(
      emails.map((email) =>
        sendWithRetry(
          (mailMessage) => this.mail.send(mailMessage),
          email,
          parseRetryDelays(this.config.get<string>('MAIL_RETRY_DELAYS_MS')),
        ),
      ),
    );

    for (const result of results) {
      if (result.delivered) continue;
      this.metrics.recordMailFailure('booking_response');
      this.logger.warn(
        `Notificação de resposta de pré-reserva não entregue após ${result.attempts} tentativas: ${result.errorName}`,
      );
    }
  }

  private async toReceivedResponses(
    records: BookingDoc[],
  ): Promise<ReceivedBookingResponse[]> {
    if (records.length === 0) return [];

    const [experiences, consumers] = await Promise.all([
      this.experiences
        .find({ _id: { $in: records.map((record) => record.experiencia) } })
        .select('_id nome valorCentavos')
        .lean<ReceivedExperience[]>()
        .exec(),
      this.users
        .find({ _id: { $in: records.map((record) => record.consumidor) } })
        .select('_id nome')
        .lean<ReceivedConsumer[]>()
        .exec(),
    ]);
    const experienceById = new Map(
      experiences.map((experience) => [experience._id.toString(), experience]),
    );
    const consumerById = new Map(
      consumers.map((consumer) => [consumer._id.toString(), consumer]),
    );

    return records.map((record) => {
      const experience = experienceById.get(record.experiencia.toString());
      const consumer = consumerById.get(record.consumidor.toString());
      if (!experience || !consumer) {
        throw new NotFoundException(
          'Não foi possível carregar os dados da pré-reserva.',
        );
      }

      const id = record._id.toString();
      return {
        id,
        experienciaId: record.experiencia.toString(),
        data: record.data,
        horario: record.horario,
        participantes: record.participantes,
        formaPagamento: record.formaPagamento,
        ...(record.mensagem ? { mensagem: record.mensagem } : {}),
        status: record.status,
        criadoEm: (record.criadoEm ?? new Date()).toISOString(),
        ...(record.mensagemResposta
          ? { mensagemResposta: record.mensagemResposta }
          : {}),
        codigo: `CAF-${id.slice(-6).toUpperCase()}`,
        experienciaNome: experience.nome,
        consumidorNome: consumer.nome,
        valorTotal: (experience.valorCentavos * record.participantes) / 100,
      };
    });
  }

  /** Mesma visibilidade de `GET /experiences/:id`: disponível e de produtor ativo. */
  private async bookableExperience(
    id: string,
  ): Promise<BookableExperience | null> {
    if (!isObjectIdOrHexString(id)) return null;
    const experience = await this.experiences
      .findOne({ _id: id, disponivel: true })
      .select('produtor')
      .lean<BookableExperience>()
      .exec();
    if (!experience) return null;
    const producer = await this.users
      .findOne({ _id: experience.produtor, perfil: Role.PRODUTOR, ativo: true })
      .select('_id')
      .lean()
      .exec();
    return producer ? experience : null;
  }

  private toResponse(booking: BookingDoc): BookingResponse {
    return {
      id: booking._id.toString(),
      experienciaId: booking.experiencia.toString(),
      data: booking.data,
      horario: booking.horario,
      participantes: booking.participantes,
      formaPagamento: booking.formaPagamento,
      ...(booking.mensagem ? { mensagem: booking.mensagem } : {}),
      status: booking.status,
      criadoEm: (booking.criadoEm ?? new Date()).toISOString(),
    };
  }
}
