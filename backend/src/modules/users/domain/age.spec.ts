import { isAdult } from './age.js';

describe('RN15 / RNF15 — confirmação de maioridade', () => {
  const today = new Date('2026-10-28T12:00:00Z');

  it('aceita quem completa 18 anos hoje', () => {
    expect(isAdult(new Date('2008-10-28'), today)).toBe(true);
  });

  it('recusa quem completa 18 anos amanhã', () => {
    expect(isAdult(new Date('2008-10-29'), today)).toBe(false);
  });

  it('recusa quem faz aniversário mais tarde no ano', () => {
    expect(isAdult(new Date('2008-12-01'), today)).toBe(false);
  });

  it('aceita adulto', () => {
    expect(isAdult(new Date('1980-01-15'), today)).toBe(true);
  });

  it('recusa data no futuro', () => {
    expect(isAdult(new Date('2030-01-01'), today)).toBe(false);
  });

  it('recusa data inválida', () => {
    expect(isAdult(new Date('invalida'), today)).toBe(false);
  });

  it('usa a data atual por padrão', () => {
    expect(isAdult(new Date('1990-05-05'))).toBe(true);
  });
});
