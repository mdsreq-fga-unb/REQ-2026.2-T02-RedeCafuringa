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
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import {
  fromCentavos,
  IDEMPOTENCY_KEY_PATTERN,
  productPhotoPath,
  toCentavos,
} from './domain/product.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import {
  DEFAULT_PRODUCTS_PAGE,
  type ListProductsQuery,
} from './dto/list-products.query.js';
import type { ProductListResponse } from './dto/product-list.response.js';
import type { ProductResponse } from './dto/product.response.js';
import { Product } from './schemas/product.schema.js';

const PRODUCER_NOT_FOUND = 'Produtor não encontrado';
const PRODUCT_NOT_FOUND = 'Produto não encontrado';
const PHOTO_NOT_FOUND = 'Foto não encontrada';
const DUPLICATE_KEY = 11000;

type ProductDoc = Product & { _id: Types.ObjectId };

const owner = (id: Types.ObjectId | string) => ({
  tipo: PhotoOwnerType.PRODUTO,
  id,
});

/** HU15/RF15: cadastro e apresentação de produtos do produtor. */
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    private readonly gallery: PhotoGalleryService,
  ) {}

  /**
   * Cadastra o produto do produtor autenticado (CA03, CA05). O dono vem do
   * token (RN09). Com `Idempotency-Key`, reenviar após uma queda de conexão
   * devolve o mesmo produto em vez de duplicá-lo (CA07).
   */
  async create(
    userId: string,
    dto: CreateProductDto,
    files: UploadedPhotoFile[] | undefined,
    idempotencyKey?: string,
  ): Promise<ProductResponse> {
    const key = this.validKey(idempotencyKey);

    const producer = await this.activeProducer(userId);
    if (!producer) throw new NotFoundException(PRODUCER_NOT_FOUND);

    if (key) {
      const existing = await this.findByKey(userId, key);
      if (existing) return this.toResponse(existing, producer.nomeIniciativa);
    }

    // Quantidade (política do produto) e conteúdo validados antes de gravar.
    const processed = await this.gallery.prepare(PhotoOwnerType.PRODUTO, files);

    const productId = new Types.ObjectId();
    // Fotos primeiro: quem lê o produto nunca encontra uma foto ausente.
    const fotos = await this.gallery.store(owner(productId), processed);
    try {
      const created = await this.products.create({
        _id: productId,
        produtor: new Types.ObjectId(userId),
        nome: dto.nome,
        categoria: dto.categoria,
        descricao: dto.descricao,
        precoCentavos: toCentavos(dto.precoPorUnidade),
        gramasPorUnidade: dto.gramasPorUnidade,
        fotos,
        ...(key ? { chaveIdempotencia: key } : {}),
      });
      return this.toResponse(
        created.toObject() as ProductDoc,
        producer.nomeIniciativa,
      );
    } catch (error) {
      // Não deixa fotos órfãs se o produto não foi gravado.
      await this.gallery.removeAll(owner(productId));
      if (key && isDuplicateKey(error)) {
        // Dois envios simultâneos com a mesma chave: vale o que chegou antes.
        const existing = await this.findByKey(userId, key);
        if (existing) return this.toResponse(existing, producer.nomeIniciativa);
      }
      throw error;
    }
  }

  /**
   * Produto visível ao público (CA08): existe, está disponível e o produtor
   * responsável está ativo.
   */
  async getPublic(id: string): Promise<ProductResponse> {
    const { product, producer } = await this.visible(id, PRODUCT_NOT_FOUND);
    return this.toResponse(product, producer.nomeIniciativa);
  }

  /**
   * Catálogo público (consumido pela HU19): só produtos disponíveis de produtor
   * ativo, do mais novo ao mais antigo. O filtro de produtor ativo é feito no
   * banco (`$lookup`), antes de paginar, para o `total` e as páginas baterem.
   */
  async list(query: ListProductsQuery): Promise<ProductListResponse> {
    const pagina = query.pagina ?? 1;
    const limite = query.limite ?? DEFAULT_PRODUCTS_PAGE;
    const match: Record<string, unknown> = { disponivel: true };
    if (query.produtor) match.produtor = new Types.ObjectId(query.produtor);
    if (query.categoria) match.categoria = query.categoria;

    const [result] = await this.products
      .aggregate<{
        itens: Array<ProductDoc & { responsavel: { nomeIniciativa?: string } }>;
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
              { $project: { _id: 0, nomeIniciativa: 1 } },
            ],
            as: 'responsavel',
          },
        },
        { $unwind: '$responsavel' },
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
      itens: (result?.itens ?? []).map((p) =>
        this.toResponse(p, p.responsavel.nomeIniciativa),
      ),
      total: result?.total[0]?.n ?? 0,
      pagina,
      limite,
    };
  }

  async getPublicPhoto(
    productId: string,
    photoId: string,
  ): Promise<StoredPhoto> {
    const { product } = await this.visible(productId, PHOTO_NOT_FOUND);
    // Só fotos que ainda fazem parte do produto (não as de outro produto).
    if (!product.fotos.some((f) => f.id.toString() === photoId))
      throw new NotFoundException(PHOTO_NOT_FOUND);
    return this.gallery.find(owner(product._id), photoId);
  }

  private async visible(id: string, notFound: string) {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException(notFound);
    const product = await this.products
      .findOne({ _id: id, disponivel: true })
      .select('-chaveIdempotencia')
      .lean<ProductDoc>()
      .exec();
    if (!product) throw new NotFoundException(notFound);
    const producer = await this.activeProducer(product.produtor.toString());
    if (!producer) throw new NotFoundException(notFound);
    return { product, producer };
  }

  private activeProducer(id: string) {
    if (!isObjectIdOrHexString(id)) return Promise.resolve(null);
    return this.users
      .findOne({ _id: id, perfil: Role.PRODUTOR, ativo: true })
      .select('nomeIniciativa')
      .lean<{ nomeIniciativa?: string }>()
      .exec();
  }

  private findByKey(userId: string, key: string) {
    return (
      this.products
        // Cast explícito: o caminho é declarado com `Types.ObjectId` e o filtro
        // não converte texto sozinho.
        .findOne({
          produtor: new Types.ObjectId(userId),
          chaveIdempotencia: key,
        })
        .lean<ProductDoc>()
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
    product: ProductDoc,
    nomeIniciativa: string | undefined,
  ): ProductResponse {
    const id = product._id.toString();
    return {
      id,
      nome: product.nome,
      categoria: product.categoria,
      descricao: product.descricao,
      precoPorUnidade: fromCentavos(product.precoCentavos),
      gramasPorUnidade: product.gramasPorUnidade,
      fotos: product.fotos.map((f) =>
        productPhotoPath(id, f.id.toString(), f.versao),
      ),
      produtor: {
        id: product.produtor.toString(),
        nomeIniciativa: nomeIniciativa ?? '',
      },
      criadoEm: (product.criadoEm ?? new Date()).toISOString(),
      disponivel: product.disponivel ?? true,
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
