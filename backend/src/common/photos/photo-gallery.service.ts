import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, mongo, Types } from 'mongoose';
import {
  PHOTO_GALLERY_POLICIES,
  type PhotoOwnerType,
} from './photo-gallery.policy.js';
import {
  InvalidPhotoError,
  processPhoto,
  type ProcessedPhoto,
} from './photo-processing.js';
import { Photo } from './photo.schema.js';

/** Arquivo recebido pelo upload (multer em memória). */
export interface UploadedPhotoFile {
  buffer: Buffer;
}

/** Referência guardada na entidade dona, na ordem da galeria. */
export interface PhotoRef {
  id: Types.ObjectId;
  versao: string;
}

export interface PhotoOwnerKey {
  tipo: PhotoOwnerType;
  id: Types.ObjectId | string;
}

export type StoredPhoto = Pick<Photo, 'dados' | 'tipo' | 'versao'>;

const PHOTO_NOT_FOUND = 'Foto não encontrada';

/**
 * Galerias de fotos de qualquer entidade (produto hoje; propriedade e outras
 * depois). Valida a quantidade pela política do tipo, processa as imagens e
 * grava/remove/lê as fotos de um dono.
 */
@Injectable()
export class PhotoGalleryService {
  constructor(@InjectModel(Photo.name) private readonly photos: Model<Photo>) {}

  /**
   * Valida e processa os arquivos ANTES de qualquer gravação, uma foto de cada
   * vez (limita memória e CPU do sharp em máquinas pequenas). Erros viram 400/415
   * com mensagem em português.
   */
  async prepare(
    tipo: PhotoOwnerType,
    files: UploadedPhotoFile[] | undefined,
  ): Promise<ProcessedPhoto[]> {
    const policy = PHOTO_GALLERY_POLICIES[tipo];
    const received = (files ?? []).filter((file) => file?.buffer?.length);
    if (received.length < policy.min) {
      throw new BadRequestException([
        policy.min === 1
          ? `Adicione ao menos uma foto no campo "${policy.campo}"`
          : `Adicione ao menos ${policy.min} fotos no campo "${policy.campo}"`,
      ]);
    }
    if (received.length > policy.max) {
      throw new BadRequestException([
        `Envie no máximo ${policy.max} fotos, todas no campo "${policy.campo}"`,
      ]);
    }

    const processed: ProcessedPhoto[] = [];
    for (const file of received) {
      try {
        processed.push(await processPhoto(file.buffer));
      } catch (error) {
        if (!(error instanceof InvalidPhotoError)) throw error;
        throw error.motivo === 'formato'
          ? new UnsupportedMediaTypeException(error.message)
          : new BadRequestException([error.message]);
      }
    }
    return processed;
  }

  /** Grava as fotos já preparadas como a galeria do dono e devolve as referências. */
  async store(
    owner: PhotoOwnerKey,
    processed: ProcessedPhoto[],
  ): Promise<PhotoRef[]> {
    const dono = { tipo: owner.tipo, id: new Types.ObjectId(owner.id) };
    const now = new Date();
    const docs = processed.map((photo, ordem) => ({
      _id: new Types.ObjectId(),
      dono,
      ordem,
      dados: photo.dados,
      tipo: photo.tipo,
      largura: photo.largura,
      altura: photo.altura,
      bytes: photo.bytes,
      versao: photo.versao,
      criadoEm: now,
    }));
    if (docs.length) await this.photos.insertMany(docs);
    return docs.map((doc) => ({ id: doc._id, versao: doc.versao }));
  }

  /** Remove toda a galeria do dono. Idempotente. */
  async removeAll(owner: PhotoOwnerKey): Promise<void> {
    await this.photos
      .deleteMany({
        'dono.tipo': owner.tipo,
        'dono.id': new Types.ObjectId(owner.id),
      })
      .exec();
  }

  /**
   * Lê uma foto da galeria do dono. A entidade decide antes se ela é visível;
   * aqui só se garante que a foto pertence àquele dono.
   */
  async find(owner: PhotoOwnerKey, photoId: string): Promise<StoredPhoto> {
    if (!isObjectIdOrHexString(photoId))
      throw new NotFoundException(PHOTO_NOT_FOUND);
    const photo = await this.photos
      .findOne({
        _id: photoId,
        'dono.tipo': owner.tipo,
        'dono.id': new Types.ObjectId(owner.id),
      })
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
}
