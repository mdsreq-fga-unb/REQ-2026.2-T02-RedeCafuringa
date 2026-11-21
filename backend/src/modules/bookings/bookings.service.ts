import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { Experience } from '../experiences/schemas/experience.schema.js';
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import { INITIAL_BOOKING_STATUS, isBookingInPast } from './domain/booking.js';
import type { BookingResponse } from './dto/booking.response.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import { Booking } from './schemas/booking.schema.js';

const EXPERIENCE_UNAVAILABLE = 'Experiência indisponível para pré-reserva';
const IN_PAST = 'A data e o horário da pré-reserva não podem estar no passado';

type BookingDoc = Booking & { _id: Types.ObjectId };
type BookableExperience = { _id: Types.ObjectId; produtor: Types.ObjectId };

/** HU44/RF44: solicitação de pré-reserva de experiência pelo consumidor. */
@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Experience.name)
    private readonly experiences: Model<Experience>,
    @InjectModel(User.name) private readonly users: Model<User>,
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
