import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ProductCategory } from '../domain/product.js';

/** Referência a uma foto da galeria (`photos`, dono `produto`), na ordem enviada. */
@Schema({ _id: false, versionKey: false })
export class ProductPhotoRef {
  @Prop({ type: Types.ObjectId, required: true })
  id: Types.ObjectId;

  /** Impressão digital do conteúdo; entra na URL pública (cache permanente). */
  @Prop({ required: true })
  versao: string;
}

const ProductPhotoRefSchema = SchemaFactory.createForClass(ProductPhotoRef);

/**
 * HU15/RF15: produto ofertado por um produtor.
 *
 * O dono é sempre `produtor` (RN09), definido pelo token, nunca pelo corpo da
 * requisição. O nome da iniciativa não é copiado: é lido da conta ao apresentar
 * o produto (CA08), para refletir alterações de cadastro.
 */
@Schema({
  collection: 'products',
  versionKey: false,
  timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
})
export class Product {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  produtor: Types.ObjectId;

  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: true, enum: ProductCategory, type: String })
  categoria: ProductCategory;

  @Prop({ required: true })
  descricao: string;

  /** Preço por unidade em centavos (inteiro). */
  @Prop({ required: true, min: 0 })
  precoCentavos: number;

  @Prop({ required: true, min: 0 })
  gramasPorUnidade: number;

  @Prop({ type: [ProductPhotoRefSchema], required: true })
  fotos: ProductPhotoRef[];

  /**
   * RN10/RF18: um produto pode sair da oferta pública sem ser excluído. Nasce
   * disponível; a HU de disponibilidade passa a alterar este campo.
   */
  @Prop({ default: true })
  disponivel: boolean;

  /** `Idempotency-Key` do envio que criou o produto (CA07). */
  @Prop()
  chaveIdempotencia?: string;

  criadoEm?: Date;
  atualizadoEm?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Reenvio com a mesma chave pelo mesmo produtor devolve o produto já criado.
// Parcial: produtos sem chave não disputam o índice.
ProductSchema.index(
  { produtor: 1, chaveIdempotencia: 1 },
  {
    unique: true,
    partialFilterExpression: { chaveIdempotencia: { $type: 'string' } },
  },
);

// Catálogo público: disponíveis do mais novo ao mais antigo, com ou sem filtro
// de produtor/categoria (GET /products).
ProductSchema.index({ disponivel: 1, criadoEm: -1, _id: -1 });
ProductSchema.index({ produtor: 1, disponivel: 1, criadoEm: -1, _id: -1 });
