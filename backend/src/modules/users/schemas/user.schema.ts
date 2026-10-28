import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../domain/role.js';

/**
 * Conta de acesso (consumidor, produtor ou administrador — RN01).
 * O CPF nunca é gravado em texto: `cpfHash` serve à busca no login e ao índice
 * único; `cpfCifrado` permite exibi-lo ao titular (D1, RNF11).
 */
@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: true, unique: true })
  cpfHash: string;

  @Prop({ required: true })
  cpfCifrado: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  telefone: string;

  @Prop({ required: true })
  dataNascimento: Date;

  @Prop({ required: true })
  senhaHash: string;

  @Prop({ required: true, enum: Role, type: String })
  perfil: Role;

  @Prop({ default: true })
  ativo: boolean;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
