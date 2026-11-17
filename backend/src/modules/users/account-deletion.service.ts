import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { PhotoOwnerType } from '../../common/photos/photo-gallery.policy.js';
import { PhotoGalleryService } from '../../common/photos/photo-gallery.service.js';
import { PasswordResetToken } from '../auth/password-reset/schemas/password-reset-token.schema.js';
import { Experience } from '../experiences/schemas/experience.schema.js';
import { ProducerPhoto } from '../producer-profile/schemas/producer-photo.schema.js';
import { Product } from '../products/schemas/product.schema.js';
import { BannedIdentitiesService } from './banned-identities.service.js';
import { DeletionReason } from './domain/deletion-reason.js';
import { Role } from './domain/role.js';
import { User } from './schemas/user.schema.js';

const NOT_FOUND = 'Conta não encontrada ou já excluída';
const SELF = 'Você não pode excluir a sua própria conta';
const BOOTSTRAP_ADMIN = 'A conta administrativa inicial não pode ser excluída';

type Owned = { _id: Types.ObjectId };

/**
 * Exclusão administrativa definitiva de uma conta (RN03, RN04).
 *
 * Exclusão, não anonimização (RNF11, LGPD art. 16): a plataforma não tem
 * obrigação legal de guardar os dados, então a conta e tudo o que só existe
 * por causa dela saem do banco. E-mail, CPF e CNPJ ficam livres para um novo
 * cadastro.
 *
 * Sem transação (o Mongo do projeto roda sem réplica). A ordem garante um
 * estado seguro a cada passo: a conta é desativada primeiro (sessões, perfil
 * público e ofertas saem do ar na hora, pelos filtros de produtor ativo), os
 * dependentes são apagados e a conta some por último. Se algo falhar no meio,
 * ela continua listada e desativada, e repetir a exclusão termina o serviço.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Experience.name)
    private readonly experiences: Model<Experience>,
    @InjectModel(ProducerPhoto.name)
    private readonly producerPhotos: Model<ProducerPhoto>,
    @InjectModel(PasswordResetToken.name)
    private readonly resetTokens: Model<PasswordResetToken>,
    private readonly gallery: PhotoGalleryService,
    private readonly config: ConfigService,
    private readonly bans: BannedIdentitiesService,
  ) {}

  async delete(
    adminId: string,
    targetId: string,
    motivo: DeletionReason,
  ): Promise<void> {
    if (adminId === targetId) throw new ConflictException(SELF);
    if (!isValidObjectId(targetId)) throw new NotFoundException(NOT_FOUND);

    const target = await this.users
      .findById(targetId)
      .select('perfil email cpfHash cnpjHash')
      .lean<{
        perfil: Role;
        email: string;
        cpfHash?: string;
        cnpjHash?: string;
      }>()
      .exec();
    if (!target) throw new NotFoundException(NOT_FOUND);
    if (this.isBootstrapAdmin(target))
      throw new ConflictException(BOOTSTRAP_ADMIN);

    // Banimento antes de tudo: se algo falhar depois, o bloqueio já vale.
    if (motivo === DeletionReason.DESCUMPRIMENTO_REGRAS)
      await this.bans.ban({
        cpfHash: target.cpfHash,
        cnpjHash: target.cnpjHash,
        email: target.email,
      });

    const id = new Types.ObjectId(targetId);
    await this.users.updateOne({ _id: id }, { $set: { ativo: false } }).exec();
    await this.removeOffers(id);
    await Promise.all([
      // A foto de perfil (HU12) é gravada com o id da conta em texto (o upsert
      // não converte); pelo driver, sem conversão, apaga nos dois formatos.
      this.producerPhotos.collection.deleteMany({
        _id: { $in: [id, targetId] as unknown as Types.ObjectId[] },
      }),
      this.resetTokens.deleteMany({ userId: id }).exec(),
    ]);
    await this.users.deleteOne({ _id: id }).exec();

    // Auditoria (RN04): só identificadores, nenhum dado pessoal da conta.
    this.logger.log({
      msg: 'Conta excluída pela administração',
      adminId,
      contaId: targetId,
      perfil: target.perfil,
      motivo,
    });
  }

  /** Produtos e experiências do produtor, com as galerias de fotos. */
  private async removeOffers(produtor: Types.ObjectId): Promise<void> {
    const [products, experiences] = await Promise.all([
      this.products.find({ produtor }).select('_id').lean<Owned[]>().exec(),
      this.experiences.find({ produtor }).select('_id').lean<Owned[]>().exec(),
    ]);
    // Fotos antes das ofertas: uma oferta nunca aponta para foto ausente.
    for (const { _id } of products)
      await this.gallery.removeAll({ tipo: PhotoOwnerType.PRODUTO, id: _id });
    for (const { _id } of experiences)
      await this.gallery.removeAll({
        tipo: PhotoOwnerType.EXPERIENCIA,
        id: _id,
      });
    await Promise.all([
      this.products.deleteMany({ produtor }).exec(),
      this.experiences.deleteMany({ produtor }).exec(),
    ]);
  }

  /**
   * O administrador inicial (ADMIN_BOOTSTRAP_EMAIL) é recriado a cada boot
   * com a senha do ambiente: excluí-lo só o faria voltar.
   */
  private isBootstrapAdmin(target: { perfil: Role; email: string }): boolean {
    const bootstrap = this.config.get<string>('ADMIN_BOOTSTRAP_EMAIL');
    return (
      target.perfil === Role.ADMINISTRADOR &&
      !!bootstrap &&
      target.email === bootstrap.trim().toLowerCase()
    );
  }
}
