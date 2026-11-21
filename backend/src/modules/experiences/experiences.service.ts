import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { PhotoOwnerType } from '../../common/photos/photo-gallery.policy.js';
import {
  PhotoGalleryService,
  type StoredPhoto,
  type UploadedPhotoFile,
} from '../../common/photos/photo-gallery.service.js';
import {
  fromCentavos,
  IDEMPOTENCY_KEY_PATTERN,
  toCentavos,
} from '../products/domain/product.js';
import { buildProductSearch } from '../products/domain/product-search.js';
import { DEFAULT_PRODUCTS_PAGE } from '../products/dto/list-products.query.js';
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import { experiencePhotoPath } from './domain/experience.js';
import type { CreateExperienceDto } from './dto/create-experience.dto.js';
import type {
  ExperienceListResponse,
  ExperienceResponse,
} from './dto/experience.response.js';
import type { ListExperiencesQuery } from './dto/list-experiences.query.js';
import { Experience } from './schemas/experience.schema.js';

const PRODUCER_NOT_FOUND = 'Produtor não encontrado';
const EXPERIENCE_NOT_FOUND = 'Experiência não encontrada';
const PHOTO_NOT_FOUND = 'Foto não encontrada';
const DUPLICATE_KEY = 11000;

type ExperienceDoc = Experience & { _id: Types.ObjectId };

/**
 * Dados de divulgação do produtor que acompanham a oferta (CA08, RN09, RN11).
 * Só estes campos são lidos da conta: e-mail, telefone e documentos nunca
 * chegam à resposta.
 */
type PublicProducer = { nomeIniciativa?: string; localidade?: string };
const PUBLIC_PRODUCER_FIELDS = 'nomeIniciativa localidade';

const owner = (id: Types.ObjectId | string) => ({
  tipo: PhotoOwnerType.EXPERIENCIA,
  id,
});

/** HU21/RF21: cadastro e apresentação de experiências do produtor. */
@Injectable()
export class ExperiencesService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Experience.name)
    private readonly experiences: Model<Experience>,
    private readonly gallery: PhotoGalleryService,
  ) {}

  /**
   * Cadastra a experiência do produtor autenticado (CA03, CA05). O dono vem do
   * token (RN09). Com `Idempotency-Key`, reenviar após uma queda de conexão
   * devolve a mesma experiência em vez de duplicá-la (CA07).
   */
  async create(
    userId: string,
    dto: CreateExperienceDto,
    files: UploadedPhotoFile[] | undefined,
    idempotencyKey?: string,
  ): Promise<ExperienceResponse> {
    const key = this.validKey(idempotencyKey);

    const producer = await this.activeProducer(userId);
    if (!producer) throw new NotFoundException(PRODUCER_NOT_FOUND);

    if (key) {
      const existing = await this.findByKey(userId, key);
      if (existing) return this.toResponse(existing, producer);
    }

    const processed = await this.gallery.prepare(
      PhotoOwnerType.EXPERIENCIA,
      files,
    );

    const experienceId = new Types.ObjectId();
    // Fotos primeiro: quem lê a experiência nunca encontra uma foto ausente.
    const fotos = await this.gallery.store(owner(experienceId), processed);
    try {
      const created = await this.experiences.create({
        _id: experienceId,
        produtor: new Types.ObjectId(userId),
        nome: dto.nome,
        categoria: dto.categoria,
        descricao: dto.descricao,
        valorCentavos: toCentavos(dto.valorPorPessoa),
        local: dto.local,
        duracao: dto.duracao,
        fotos,
        ...(key ? { chaveIdempotencia: key } : {}),
      });
      return this.toResponse(created.toObject() as ExperienceDoc, producer);
    } catch (error) {
      // Não deixa fotos órfãs se a experiência não foi gravada.
      await this.gallery.removeAll(owner(experienceId));
      if (key && isDuplicateKey(error)) {
        const existing = await this.findByKey(userId, key);
        if (existing) return this.toResponse(existing, producer);
      }
      throw error;
    }
  }

  /** Experiência visível ao público: disponível e com produtor ativo (CA08). */
  async getPublic(id: string): Promise<ExperienceResponse> {
    const { experience, producer } = await this.visible(
      id,
      EXPERIENCE_NOT_FOUND,
    );
    return this.toResponse(experience, producer);
  }

  /**
   * Catálogo público: só experiências disponíveis de produtor ativo, da mais
   * nova à mais antiga. O filtro de produtor ativo vem antes de paginar, para
   * o `total` e as páginas baterem (mesma estratégia de `GET /products`).
   * A busca por texto (HU36) vem depois do `$lookup`, porque também procura
   * no nome da iniciativa do produtor.
   */
  async list(query: ListExperiencesQuery): Promise<ExperienceListResponse> {
    const pagina = query.pagina ?? 1;
    const limite = query.limite ?? DEFAULT_PRODUCTS_PAGE;
    const match: Record<string, unknown> = { disponivel: true };
    if (query.produtor) match.produtor = new Types.ObjectId(query.produtor);
    const search = buildProductSearch(query.busca);

    const [result] = await this.experiences
      .aggregate<{
        itens: Array<ExperienceDoc & { responsavel: PublicProducer }>;
        total: Array<{ n: number }>;
      }>([
        { $match: match },
        { $sort: { criadoEm: -1, _id: -1 } },
        {
          $lookup: {
            from: this.users.collection.name,
            localField: 'produtor',
            foreignField: '_id',
            pipeline: [
              { $match: { perfil: Role.PRODUTOR, ativo: true } },
              { $project: { _id: 0, nomeIniciativa: 1, localidade: 1 } },
            ],
            as: 'responsavel',
          },
        },
        { $unwind: '$responsavel' },
        ...(search ? [{ $match: search }] : []),
        { $project: { chaveIdempotencia: 0 } },
        {
          $facet: {
            itens: [{ $skip: (pagina - 1) * limite }, { $limit: limite }],
            total: [{ $count: 'n' }],
          },
        },
      ])
      .exec();

    return {
      itens: (result?.itens ?? []).map((e) =>
        this.toResponse(e, e.responsavel),
      ),
      total: result?.total[0]?.n ?? 0,
      pagina,
      limite,
    };
  }

  async getPublicPhoto(
    experienceId: string,
    photoId: string,
  ): Promise<StoredPhoto> {
    const { experience } = await this.visible(experienceId, PHOTO_NOT_FOUND);
    if (!experience.fotos.some((f) => f.id.toString() === photoId))
      throw new NotFoundException(PHOTO_NOT_FOUND);
    return this.gallery.find(owner(experience._id), photoId);
  }

  private async visible(id: string, notFound: string) {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException(notFound);
    const experience = await this.experiences
      .findOne({ _id: id, disponivel: true })
      .select('-chaveIdempotencia')
      .lean<ExperienceDoc>()
      .exec();
    if (!experience) throw new NotFoundException(notFound);
    const producer = await this.activeProducer(experience.produtor.toString());
    if (!producer) throw new NotFoundException(notFound);
    return { experience, producer };
  }

  private activeProducer(id: string) {
    if (!isObjectIdOrHexString(id)) return Promise.resolve(null);
    return this.users
      .findOne({ _id: id, perfil: Role.PRODUTOR, ativo: true })
      .select(PUBLIC_PRODUCER_FIELDS)
      .lean<PublicProducer>()
      .exec();
  }

  private findByKey(userId: string, key: string) {
    return (
      this.experiences
        // Cast explícito: o filtro não converte texto em ObjectId sozinho.
        .findOne({
          produtor: new Types.ObjectId(userId),
          chaveIdempotencia: key,
        })
        .lean<ExperienceDoc>()
        .exec()
    );
  }

  private validKey(key: string | undefined): string | undefined {
    if (key === undefined || key === '') return undefined;
    if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
      throw new BadRequestException([
        'Idempotency-Key deve ter de 8 a 64 letras, números, "-" ou "_"',
      ]);
    }
    return key;
  }

  private toResponse(
    experience: ExperienceDoc,
    { nomeIniciativa, localidade }: PublicProducer,
  ): ExperienceResponse {
    const id = experience._id.toString();
    return {
      id,
      nome: experience.nome,
      categoria: experience.categoria,
      descricao: experience.descricao,
      valorPorPessoa: fromCentavos(experience.valorCentavos),
      local: experience.local,
      duracao: experience.duracao,
      fotos: experience.fotos.map((f) =>
        experiencePhotoPath(id, f.id.toString(), f.versao),
      ),
      produtor: {
        id: experience.produtor.toString(),
        nomeIniciativa: nomeIniciativa ?? '',
        ...(localidade ? { localidade } : {}),
      },
      criadoEm: (experience.criadoEm ?? new Date()).toISOString(),
      disponivel: experience.disponivel ?? true,
    };
  }
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY
  );
}
