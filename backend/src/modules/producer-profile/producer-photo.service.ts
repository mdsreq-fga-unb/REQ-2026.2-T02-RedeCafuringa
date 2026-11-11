import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, mongo } from 'mongoose';
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import {
  InvalidPhotoError,
  photoPath,
  processProfilePhoto,
  type ProcessedPhoto,
} from './domain/profile-photo.js';
import type { PhotoResponse } from './dto/photo.response.js';
import { ProducerPhoto } from './schemas/producer-photo.schema.js';

const NOT_FOUND = 'Produtor não encontrado';
const PHOTO_NOT_FOUND = 'Foto não encontrada';

/** Arquivo recebido pelo upload (multer em memória). */
export interface UploadedPhoto {
  buffer: Buffer;
}

export type StoredPhoto = Pick<ProducerPhoto, 'dados' | 'tipo' | 'versao'>;

/** HU12/RF12: foto de perfil do produtor. */
@Injectable()
export class ProducerPhotoService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(ProducerPhoto.name)
    private readonly photos: Model<ProducerPhoto>,
  ) {}

  /**
   * Substitui a foto do produtor autenticado. A imagem é reprocessada antes de
   * gravar (sem EXIF/GPS, WebP, tamanho limitado). Reenviar a mesma foto gera
   * a mesma versão, então repetir após uma queda de conexão é seguro (CA07).
   */
  async save(
    userId: string,
    file: UploadedPhoto | undefined,
  ): Promise<PhotoResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Envie a foto no campo "foto".');
    }
    const photo = await this.process(file.buffer);

    // Grava o binário antes de apontar a conta para ele: quem lê a versão
    // nova nunca encontra a foto ausente.
    await this.photos
      .updateOne(
        { _id: userId },
        {
          $set: {
            dados: photo.dados,
            tipo: photo.tipo,
            largura: photo.largura,
            altura: photo.altura,
            bytes: photo.bytes,
            versao: photo.versao,
            atualizadoEm: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();

    const linked = await this.users
      .updateOne(this.activeProducer(userId), {
        $set: { fotoVersao: photo.versao },
      })
      .exec();
    if (linked.matchedCount === 0) {
      // A conta foi desativada no meio do envio: não deixa a foto órfã.
      await this.photos.deleteOne({ _id: userId }).exec();
      throw new NotFoundException(NOT_FOUND);
    }

    return { fotoUrl: photoPath(userId, photo.versao) };
  }

  /** Remove a foto do produtor autenticado. Idempotente. */
  async remove(userId: string): Promise<void> {
    const unlinked = await this.users
      .updateOne(this.activeProducer(userId), { $unset: { fotoVersao: 1 } })
      .exec();
    if (unlinked.matchedCount === 0) throw new NotFoundException(NOT_FOUND);
    await this.photos.deleteOne({ _id: userId }).exec();
  }

  /**
   * CA05/RN07: a foto só é pública nas mesmas condições do perfil (produtor
   * ativo com trajetória publicada).
   */
  async getPublic(id: string): Promise<StoredPhoto> {
    if (!isObjectIdOrHexString(id))
      throw new NotFoundException(PHOTO_NOT_FOUND);

    const visible = await this.users
      .exists({
        ...this.activeProducer(id),
        trajetoria: { $type: 'string', $ne: '' },
        fotoVersao: { $exists: true },
      })
      .exec();
    if (!visible) throw new NotFoundException(PHOTO_NOT_FOUND);

    const photo = await this.photos
      .findById(id)
      .select('dados tipo versao')
      .lean<Omit<StoredPhoto, 'dados'> & { dados: Buffer | mongo.Binary }>()
      .exec();
    if (!photo) throw new NotFoundException(PHOTO_NOT_FOUND);
    // Com lean() o driver devolve o tipo Binary do BSON, não um Buffer.
    const { dados } = photo;
    return {
      ...photo,
      dados: Buffer.isBuffer(dados) ? dados : Buffer.from(dados.buffer),
    };
  }

  private async process(input: Buffer): Promise<ProcessedPhoto> {
    try {
      return await processProfilePhoto(input);
    } catch (error) {
      if (!(error instanceof InvalidPhotoError)) throw error;
      throw error.motivo === 'formato'
        ? new UnsupportedMediaTypeException(error.message)
        : new BadRequestException(error.message);
    }
  }

  private activeProducer(id: string) {
    return { _id: id, perfil: Role.PRODUTOR, ativo: true };
  }
}
