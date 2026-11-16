import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PhotoOwnerType } from './photo-gallery.policy.js';

/** Dono da foto: a entidade e o seu id (produto, propriedade…). */
@Schema({ _id: false, versionKey: false })
export class PhotoOwner {
  @Prop({ required: true, enum: PhotoOwnerType, type: String })
  tipo: PhotoOwnerType;

  @Prop({ type: Types.ObjectId, required: true })
  id: Types.ObjectId;
}

const PhotoOwnerSchema = SchemaFactory.createForClass(PhotoOwner);

/**
 * Foto de uma galeria, já processada (WebP sem metadados).
 *
 * Uma coleção só para todas as galerias: a entidade guarda apenas `{ id, versao }`
 * de cada foto, e nenhuma consulta de produto/propriedade carrega binários por
 * acidente. Cada foto tem ~50-100 KB, bem abaixo do limite de 16 MB do documento,
 * e entra no backup diário do banco sem serviço extra (RNF13).
 *
 * A foto de perfil (HU12) continua em `producer_photos`: é única por conta e
 * tem o mesmo `_id` do usuário.
 */
@Schema({ collection: 'photos', versionKey: false })
export class Photo {
  @Prop({ type: PhotoOwnerSchema, required: true })
  dono: PhotoOwner;

  /** Posição na galeria (0 = capa). */
  @Prop({ required: true, min: 0 })
  ordem: number;

  @Prop({ type: Buffer, required: true })
  dados: Buffer;

  @Prop({ required: true })
  tipo: string;

  @Prop({ required: true })
  largura: number;

  @Prop({ required: true })
  altura: number;

  @Prop({ required: true })
  bytes: number;

  @Prop({ required: true })
  versao: string;

  @Prop({ required: true })
  criadoEm: Date;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);

// Galeria de um dono, na ordem: a consulta e a remoção usam este índice.
PhotoSchema.index({ 'dono.tipo': 1, 'dono.id': 1, ordem: 1 });
