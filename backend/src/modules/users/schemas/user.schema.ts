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

  /** HU12: história do produtor, exibida no perfil público (RN07). Texto simples. */
  @Prop()
  trajetoria?: string;

  /** HU12: atividades que o produtor desenvolve. Texto simples. */
  @Prop()
  atividades?: string;

  /** HU12/RN07: o telefone só aparece no perfil público se o produtor autorizar. */
  @Prop({ default: false })
  telefonePublico: boolean;

  @Prop()
  trajetoriaAtualizadaEm?: Date;

  /**
   * HU12/RF12: versão da foto de perfil (o binário fica em `producer_photos`).
   * Ausente quando o produtor não tem foto.
   */
  @Prop()
  fotoVersao?: string;

  @Prop({ required: true })
  senhaHash: string;

  @Prop({ required: true, enum: Role, type: String })
  perfil: Role;

  @Prop({ default: true })
  ativo: boolean;

  /**
   * HU10: momento da última troca de senha. JWTs emitidos antes disso deixam
   * de valer (o JwtAuthGuard compara com o `iat` do token).
   */
  @Prop()
  credenciaisAlteradasEm?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
