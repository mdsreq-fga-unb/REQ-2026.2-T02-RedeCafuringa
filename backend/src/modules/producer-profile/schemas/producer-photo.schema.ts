import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * HU12/RF12: foto de perfil já processada (WebP sem metadados).
 *
 * Fica numa coleção própria, com o mesmo `_id` da conta, para que nenhuma
 * consulta de usuário carregue o binário por acidente. Uma foto tem ~50-100 KB
 * e há no máximo uma por produtor, bem abaixo do limite de 16 MB do documento.
 * O backup diário do banco já a inclui, sem custo nem serviço extra (RNF13).
 */
@Schema({ collection: 'producer_photos', versionKey: false })
export class ProducerPhoto {
  /** Id da conta do produtor (`users._id`). */
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

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

  /** Impressão digital do conteúdo; a mesma gravada em `users.fotoVersao`. */
  @Prop({ required: true })
  versao: string;

  @Prop({ required: true })
  atualizadoEm: Date;
}

export const ProducerPhotoSchema = SchemaFactory.createForClass(ProducerPhoto);
