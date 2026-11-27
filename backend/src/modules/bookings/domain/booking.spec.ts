import {
  acceptedPaymentMethods,
  BOOKING_HOURS,
  BookingStatus,
  INITIAL_BOOKING_STATUS,
  isBookingInPast,
  isValidBookingDate,
  PARTICIPANTES_MAX,
  PARTICIPANTES_MIN,
  PaymentMethod,
} from './booking.js';

describe('HU44 — regras da pré-reserva', () => {
  describe('RN19 — estado inicial', () => {
    it('a solicitação nasce pendente, sem confirmação automática', () => {
      expect(INITIAL_BOOKING_STATUS).toBe(BookingStatus.PENDENTE);
    });

    it('usa os mesmos estados que o app conhece', () => {
      expect(Object.values(BookingStatus)).toEqual([
        'pendente',
        'aceita',
        'recusada',
        'cancelada',
      ]);
    });
  });

  it('CA03 — aceita as formas de pagamento oferecidas pelo app', () => {
    expect(Object.values(PaymentMethod)).toEqual([
      'pix',
      'dinheiro',
      'cartao_credito',
      'cartao_debito',
    ]);
  });

  describe('acceptedPaymentMethods — formas que a produtora aceita', () => {
    it('só as formas cadastradas na experiência, na ordem do app', () => {
      expect(
        acceptedPaymentMethods({
          exigeSinal: false,
          formasPagamentoNoDia: [
            PaymentMethod.CARTAO_DEBITO,
            PaymentMethod.DINHEIRO,
          ],
        }),
      ).toEqual([PaymentMethod.DINHEIRO, PaymentMethod.CARTAO_DEBITO]);
    });

    it('com sinal, o Pix sempre entra (o sinal é pago por Pix)', () => {
      expect(
        acceptedPaymentMethods({
          exigeSinal: true,
          formasPagamentoNoDia: [PaymentMethod.DINHEIRO],
        }),
      ).toEqual([PaymentMethod.PIX, PaymentMethod.DINHEIRO]);
    });

    it('experiência antiga (sem o campo de sinal) pede sinal: inclui o Pix', () => {
      expect(
        acceptedPaymentMethods({
          formasPagamentoNoDia: [PaymentMethod.DINHEIRO],
        }),
      ).toEqual([PaymentMethod.PIX, PaymentMethod.DINHEIRO]);
    });

    it('sem nenhuma forma cadastrada e sem sinal, aceita todas para não travar a reserva', () => {
      expect(
        acceptedPaymentMethods({ exigeSinal: false, formasPagamentoNoDia: [] }),
      ).toEqual(Object.values(PaymentMethod));
      expect(acceptedPaymentMethods({ exigeSinal: false })).toEqual(
        Object.values(PaymentMethod),
      );
    });

    it('com sinal e sem formas do dia, aceita todas (experiência antiga)', () => {
      expect(acceptedPaymentMethods({ formasPagamentoNoDia: [] })).toEqual(
        Object.values(PaymentMethod),
      );
    });
  });

  it('CA03 — participantes vão de 1 a 50, como no formulário', () => {
    expect(PARTICIPANTES_MIN).toBe(1);
    expect(PARTICIPANTES_MAX).toBe(50);
  });

  it('CA03 — horários de hora em hora, de 00:00 a 23:00', () => {
    expect(BOOKING_HOURS).toHaveLength(24);
    expect(BOOKING_HOURS[0]).toBe('00:00');
    expect(BOOKING_HOURS[9]).toBe('09:00');
    expect(BOOKING_HOURS[23]).toBe('23:00');
  });

  describe('CA04 — isValidBookingDate', () => {
    it.each(['2026-11-21', '2028-02-29', '2026-12-31'])(
      'aceita a data real "%s"',
      (data) => {
        expect(isValidBookingDate(data)).toBe(true);
      },
    );

    it.each([
      '',
      '2026-02-30',
      '2027-02-29',
      '2026-13-01',
      '2026-00-10',
      '21/11/2026',
      '2026-11-21T10:00',
      ' 2026-11-21',
    ])('recusa "%s"', (data) => {
      expect(isValidBookingDate(data)).toBe(false);
    });

    it('recusa valores que não são texto', () => {
      expect(isValidBookingDate(20261121)).toBe(false);
      expect(isValidBookingDate(undefined)).toBe(false);
    });
  });

  describe('CA04 — isBookingInPast (horário de Brasília)', () => {
    // 21/11/2026 10:30 em Brasília (UTC-3).
    const now = new Date('2026-11-21T13:30:00.000Z');

    it('recusa data anterior a hoje', () => {
      expect(isBookingInPast('2026-11-20', '23:00', now)).toBe(true);
    });

    it('recusa horário de hoje que já começou', () => {
      expect(isBookingInPast('2026-11-21', '10:00', now)).toBe(true);
      expect(isBookingInPast('2026-11-21', '09:00', now)).toBe(true);
    });

    it('aceita horário de hoje que ainda vai começar', () => {
      expect(isBookingInPast('2026-11-21', '11:00', now)).toBe(false);
    });

    it('aceita datas futuras', () => {
      expect(isBookingInPast('2026-11-22', '00:00', now)).toBe(false);
    });

    it('considera passado o horário que começa exatamente agora', () => {
      const exato = new Date('2026-11-21T14:00:00.000Z'); // 11:00 em Brasília
      expect(isBookingInPast('2026-11-21', '11:00', exato)).toBe(true);
    });

    it('usa o dia de Brasília, não o de UTC', () => {
      // 22/11 01:00 em UTC ainda é 21/11 22:00 em Brasília.
      const noite = new Date('2026-11-22T01:00:00.000Z');
      expect(isBookingInPast('2026-11-21', '23:00', noite)).toBe(false);
      expect(isBookingInPast('2026-11-21', '22:00', noite)).toBe(true);
    });
  });
});
