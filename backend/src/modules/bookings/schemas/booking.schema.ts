import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BookingStatus,
  INITIAL_BOOKING_STATUS,
  PaymentMethod,
} from '../domain/booking.js';

/**
 * HU44/RF44: solicitação de pré-reserva de uma experiência (CP6).
 *
 * Fica ligada ao consumidor do token, à experiência e ao produtor responsável
 * (RN19). O produtor é copiado da experiência no envio, para a consulta e a
 * resposta (HU45, HU47) não dependerem de outra coleção.
 */
@Schema({
  collection: 'bookings',
  versionKey: false,
  timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
})
export class Booking {
  @Prop({ type: Types.ObjectId, required: true })
  consumidor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  experiencia: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  produtor: Types.ObjectId;

  /** Dia desejado (AAAA-MM-DD), no horário de Brasília. */
  @Prop({ required: true })
  data: string;

  /** Horário de início (HH:MM). */
  @Prop({ required: true })
  horario: string;

  @Prop({ required: true, min: 1 })
  participantes: number;

  @Prop({ required: true, enum: PaymentMethod, type: String })
  formaPagamento: PaymentMethod;

  @Prop()
  mensagem?: string;

  /** RN19: nasce pendente; só a resposta do produtor confirma. */
  @Prop({
    required: true,
    enum: BookingStatus,
    type: String,
    default: INITIAL_BOOKING_STATUS,
  })
  status: BookingStatus;

  criadoEm?: Date;
  atualizadoEm?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Solicitações do consumidor, da mais nova à mais antiga (HU45).
BookingSchema.index({ consumidor: 1, criadoEm: -1, _id: -1 });
// Solicitações recebidas pelo produtor, por situação (HU45, HU47).
BookingSchema.index({ produtor: 1, status: 1, criadoEm: -1, _id: -1 });
