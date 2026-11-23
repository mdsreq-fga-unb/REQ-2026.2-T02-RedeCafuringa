import { BookingSchema } from './booking.schema.js';

describe('HU48/RF48 — índices da pré-reserva', () => {
  const indexes = () => BookingSchema.indexes().map(([fields]) => fields);

  it('indexa as notificações do consumidor por situação e atualização mais recente', () => {
    expect(indexes()).toContainEqual({
      consumidor: 1,
      status: 1,
      atualizadoEm: -1,
      _id: -1,
    });
  });

  it('indexa as notificações do produtor por situação e atualização mais recente', () => {
    expect(indexes()).toContainEqual({
      produtor: 1,
      status: 1,
      atualizadoEm: -1,
      _id: -1,
    });
  });
});
