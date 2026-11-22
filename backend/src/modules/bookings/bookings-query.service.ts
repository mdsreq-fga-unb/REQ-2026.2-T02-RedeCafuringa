import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { experiencePhotoPath } from '../experiences/domain/experience.js';
import { Experience } from '../experiences/schemas/experience.schema.js';
import { fromCentavos } from '../products/domain/product.js';
import { DEFAULT_PRODUCTS_PAGE } from '../products/dto/list-products.query.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import type {
  BookingDetailResponse,
  BookingListResponse,
} from './dto/booking-detail.response.js';
import type { ListBookingsQuery } from './dto/list-bookings.query.js';
import { bookingProducerFilter } from './domain/booking.js';
import { Booking } from './schemas/booking.schema.js';

const NOT_FOUND = 'Pré-reserva não encontrada';
const UNKNOWN_EXPERIENCE = 'Experiência indisponível';
const UNKNOWN_PARTY = 'Usuário indisponível';

/** De quem é a consulta: define o filtro de dono e quem é "o outro lado". */
type Side = 'consumidor' | 'produtor';

type ExperienceData = {
  nome: string;
  local: string;
  valorCentavos: number;
  disponivel?: boolean;
  fotos?: Array<{ id: Types.ObjectId; versao: string }>;
};

type BookingRow = Booking & {
  _id: Types.ObjectId;
  experienciaDados?: ExperienceData;
  outroLado?: { nome?: string; nomeIniciativa?: string };
};

/**
 * HU45/RF45: consulta de pré-reservas (RNF08, RNF11).
 *
 * Consumidor vê as solicitações da própria conta; produtor vê as recebidas
 * pelas suas experiências. O dono é sempre o do token e entra no filtro do
 * banco: o que não é dele nem aparece (CA05). Lê direto da coleção `bookings`
 * (a situação mostrada é a gravada agora, CA07).
 */
@Injectable()
export class BookingsQueryService {
  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Experience.name)
    private readonly experiences: Model<Experience>,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  /** CA02: solicitações feitas pelo consumidor do token. */
  listMine(
    userId: string,
    query: ListBookingsQuery,
  ): Promise<BookingListResponse> {
    return this.list('consumidor', userId, query);
  }

  /** CA03: solicitações recebidas para as experiências do produtor do token. */
  listReceived(
    userId: string,
    query: ListBookingsQuery,
  ): Promise<BookingListResponse> {
    return this.list('produtor', userId, query);
  }

  /**
   * CA04, CA05: detalhe de uma solicitação. Registro inexistente, de terceiros
   * ou com id inválido respondem igual (404), para não revelar que existe.
   */
  async findOne(
    user: AuthenticatedUser,
    id: string,
  ): Promise<BookingDetailResponse> {
    const side = sideOf(user.perfil);
    if (!side || !isObjectIdOrHexString(id))
      throw new NotFoundException(NOT_FOUND);

    const [row] = await this.bookings
      .aggregate<BookingRow>([
        {
          $match: {
            _id: new Types.ObjectId(id),
            [side]: ownerFilter(side, user.id),
          },
        },
        ...this.joins(side),
      ])
      .exec();
    if (!row) throw new NotFoundException(NOT_FOUND);
    return this.toResponse(row, side);
  }

  private async list(
    side: Side,
    userId: string,
    query: ListBookingsQuery,
  ): Promise<BookingListResponse> {
    const pagina = query.pagina ?? 1;
    const limite = query.limite ?? DEFAULT_PRODUCTS_PAGE;
    const filter: Record<string, unknown> = {
      [side]: ownerFilter(side, userId),
      ...(query.status ? { status: query.status } : {}),
    };

    // Pagina antes de juntar experiência e outro lado: só a página paga o $lookup.
    const [rows, total] = await Promise.all([
      this.bookings
        .aggregate<BookingRow>([
          { $match: filter },
          { $sort: { criadoEm: -1, _id: -1 } },
          { $skip: (pagina - 1) * limite },
          { $limit: limite },
          ...this.joins(side),
        ])
        .exec(),
      this.bookings.countDocuments(filter).exec(),
    ]);

    return {
      itens: rows.map((row) => this.toResponse(row, side)),
      total,
      pagina,
      limite,
    };
  }

  /** Experiência (só o que o cartão mostra) e o outro lado (só nome). */
  private joins(side: Side): PipelineStage[] {
    const other = side === 'consumidor' ? 'produtorObjectId' : 'consumidor';
    return [
      ...(side === 'consumidor'
        ? [{ $set: { produtorObjectId: { $toObjectId: '$produtor' } } }]
        : []),
      {
        $lookup: {
          from: this.experiences.collection.name,
          localField: 'experiencia',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 0,
                nome: 1,
                local: 1,
                valorCentavos: 1,
                disponivel: 1,
                fotos: { $slice: ['$fotos', 1] },
              },
            },
          ],
          as: 'experienciaDados',
        },
      },
      {
        $unwind: {
          path: '$experienciaDados',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: this.users.collection.name,
          localField: other,
          foreignField: '_id',
          pipeline: [{ $project: { _id: 0, nome: 1, nomeIniciativa: 1 } }],
          as: 'outroLado',
        },
      },
      { $unwind: { path: '$outroLado', preserveNullAndEmptyArrays: true } },
    ];
  }

  private toResponse(row: BookingRow, side: Side): BookingDetailResponse {
    const experienceId = row.experiencia.toString();
    const experience = row.experienciaDados;
    const available = experience?.disponivel ?? true;
    const photo = experience?.fotos?.[0];
    const other = side === 'consumidor' ? row.produtor : row.consumidor;

    return {
      id: row._id.toString(),
      experienciaId: experienceId,
      data: row.data,
      horario: row.horario,
      participantes: row.participantes,
      formaPagamento: row.formaPagamento,
      ...(row.mensagem ? { mensagem: row.mensagem } : {}),
      status: row.status,
      criadoEm: (row.criadoEm ?? new Date()).toISOString(),
      atualizadoEm: (
        row.atualizadoEm ??
        row.criadoEm ??
        new Date()
      ).toISOString(),
      experiencia: {
        nome: experience?.nome ?? UNKNOWN_EXPERIENCE,
        local: experience?.local ?? '',
        valorPorPessoa: fromCentavos(experience?.valorCentavos ?? 0),
        disponivel: experience ? available : false,
        ...(experience && available && photo
          ? {
              foto: experiencePhotoPath(
                experienceId,
                photo.id.toString(),
                photo.versao,
              ),
            }
          : {}),
      },
      contraparte: {
        id: other.toString(),
        nome:
          row.outroLado?.nomeIniciativa?.trim() ||
          row.outroLado?.nome ||
          UNKNOWN_PARTY,
      },
    };
  }
}

function ownerFilter(side: Side, userId: string) {
  return side === 'produtor'
    ? bookingProducerFilter(userId)
    : new Types.ObjectId(userId);
}

function sideOf(perfil: Role): Side | null {
  if (perfil === Role.CONSUMIDOR) return 'consumidor';
  if (perfil === Role.PRODUTOR) return 'produtor';
  return null;
}
