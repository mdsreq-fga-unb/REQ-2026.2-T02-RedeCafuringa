import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../domain/role.js';
import { ProducerCategory } from '../domain/producer-category.js';

/**
 * Conta de acesso (consumidor, produtor ou administrador — RN01).
 * O CPF nunca é gravado em texto: `cpfHash` serve à busca no login e ao índice
 * único; `cpfCifrado` permite exibi-lo ao titular (D1, RNF11).
 */
@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  nome: string;

  // Administrador (HU03) não tem CPF: o índice único é esparso.
  @Prop({ unique: true, sparse: true })
  cpfHash?: string;

  @Prop()
  cpfCifrado?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  telefone?: string;

  @Prop({ required: false })
  dataNascimento: Date;

  @Prop({ unique: true, sparse: true })
  cnpjHash?: string;

  @Prop()
  cnpjCifrado?: string;

  @Prop({ trim: true })
  nomeIniciativa?: string;

  @Prop({ trim: true })
  nomeResponsavel?: string;

  @Prop({ trim: true })
  localidade?: string;

  @Prop({ enum: ProducerCategory, type: String })
  categoriaOfertada?: ProducerCategory;

  @Prop({ type: [String], default: undefined })
  formasPagamento?: string[];

  @Prop({ required: true })
  senhaHash: string;

  @Prop({ required: true, enum: Role, type: String })
  perfil: Role;

  @Prop({ default: true })
  ativo: boolean;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
