import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * Pedido de recuperação de acesso (HU10, RN05). Guarda só o hash do token: quem
 * lê a coleção não consegue redefinir senhas. O Mongo apaga o documento sozinho
 * quando `expiresAt` passa (índice TTL), então não sobra token vencido.
 *
 * Um documento por conta (índice único em `userId`): um pedido novo substitui o
 * anterior de forma atômica, e dois pedidos simultâneos não geram dois links.
 * `createdAt` é gravado pelo service (sem `timestamps`), porque entra no filtro
 * do intervalo mínimo entre pedidos.
 */
@Schema({ collection: 'password_reset_tokens' })
export class PasswordResetToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ required: true, type: Date, expires: 0 })
  expiresAt: Date;

  /** Preenchido ao redefinir a senha: o token vale uma única vez. */
  @Prop({ type: Date })
  usedAt?: Date;

  @Prop({ required: true, type: Date })
  createdAt: Date;
}

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;
export const PasswordResetTokenSchema =
  SchemaFactory.createForClass(PasswordResetToken);
