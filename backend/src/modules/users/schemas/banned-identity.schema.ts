import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Identificador de uma conta excluída por banimento (descumprimento das
 * regras), para impedir que a mesma pessoa se cadastre de novo.
 *
 * RNF11/LGPD: só o HMAC (`blindIndex`) do CPF, do CNPJ ou do e-mail, nunca o
 * dado em claro, e nada mais da conta: não dá para reconstruir quem é, só
 * reconhecer a mesma pessoa num novo cadastro (legítimo interesse de manter o
 * banimento). Exclusão por inatividade não grava nada aqui.
 */
@Schema({ collection: 'banned_identities', versionKey: false })
export class BannedIdentity {
  @Prop({ required: true, enum: ['cpf', 'cnpj', 'email'], type: String })
  tipo: 'cpf' | 'cnpj' | 'email';

  @Prop({ required: true, unique: true })
  hash: string;

  @Prop({ required: true, type: Date })
  banidoEm: Date;
}

export const BannedIdentitySchema =
  SchemaFactory.createForClass(BannedIdentity);
