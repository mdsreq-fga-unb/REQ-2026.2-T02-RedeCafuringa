import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ExperienceCategory } from '../domain/experience.js';

/** Referência a uma foto da galeria (`photos`, dono `experiencia`), na ordem enviada. */
@Schema({ _id: false, versionKey: false })
export class ExperiencePhotoRef {
  @Prop({ type: Types.ObjectId, required: true })
  id: Types.ObjectId;

  /** Impressão digital do conteúdo; entra na URL pública (cache permanente). */
  @Prop({ required: true })
  versao: string;
}

const ExperiencePhotoRefSchema =
  SchemaFactory.createForClass(ExperiencePhotoRef);

/**
 * HU21/RF21: experiência, atividade ou atrativo ofertado por um produtor.
 *
 * O dono é sempre `produtor` (RN09, CA03), definido pelo token, nunca pelo
 * corpo da requisição. O nome da iniciativa e a localidade não são copiados:
 * são lidos da conta ao apresentar a experiência (CA08).
 */
@Schema({
  collection: 'experiences',
  versionKey: false,
  timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
})
export class Experience {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  produtor: Types.ObjectId;

  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: true, enum: ExperienceCategory, type: String })
  categoria: ExperienceCategory;

  @Prop({ required: true })
  descricao: string;

  /** Valor por pessoa em centavos (inteiro). */
  @Prop({ required: true, min: 0 })
  valorCentavos: number;

  /** Onde a experiência acontece (texto livre de divulgação). */
  @Prop({ required: true })
  local: string;

  /** Duração já normalizada (ex.: "2 horas", "90 minutos"). */
  @Prop({ required: true })
  duracao: string;

  @Prop({ type: [ExperiencePhotoRefSchema], required: true })
  fotos: ExperiencePhotoRef[];

  /** RN10: pode sair da oferta pública sem ser excluída. Nasce disponível. */
  @Prop({ default: true })
  disponivel: boolean;

  /** `Idempotency-Key` do envio que criou a experiência (CA07). */
  @Prop()
  chaveIdempotencia?: string;

  criadoEm?: Date;
  atualizadoEm?: Date;
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);

// Reenvio com a mesma chave pelo mesmo produtor devolve a experiência já criada.
ExperienceSchema.index(
  { produtor: 1, chaveIdempotencia: 1 },
  {
    unique: true,
    partialFilterExpression: { chaveIdempotencia: { $type: 'string' } },
  },
);

// Catálogo público (GET /experiences), com ou sem filtro de produtor.
ExperienceSchema.index({ disponivel: 1, criadoEm: -1, _id: -1 });
ExperienceSchema.index({ produtor: 1, disponivel: 1, criadoEm: -1, _id: -1 });
