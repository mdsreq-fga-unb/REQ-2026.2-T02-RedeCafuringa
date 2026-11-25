import {
  PaymentStatus,
  PRAZO_SINAL_HORAS,
  SINAL_PERCENTUAL,
  effectivePaymentStatus,
  sinalDeadline,
  splitPayment,
} from './booking-payment.js';

describe('pagamento da pré-reserva — números da proposta', () => {
  it('sinal de 50%, pago em até 24 horas depois do aceite', () => {
    expect(SINAL_PERCENTUAL).toBe(50);
    expect(PRAZO_SINAL_HORAS).toBe(24);
  });
});

describe('pagamento da pré-reserva — splitPayment', () => {
  it('divide o total entre sinal e restante, em centavos', () => {
    expect(splitPayment(4500, 2)).toEqual({
      totalCentavos: 9000,
      sinalCentavos: 4500,
      restanteCentavos: 4500,
    });
  });

  it('centavo ímpar fica no sinal, e a soma sempre fecha o total', () => {
    expect(splitPayment(4501, 1)).toEqual({
      totalCentavos: 4501,
      sinalCentavos: 2251,
      restanteCentavos: 2250,
    });
  });

  it.each([
    [1, 1],
    [3333, 3],
    [99999, 7],
  ])(
    'valor %i centavos para %i pessoas: sinal + restante = total',
    (valor, pessoas) => {
      const { totalCentavos, sinalCentavos, restanteCentavos } = splitPayment(
        valor,
        pessoas,
      );

      expect(sinalCentavos + restanteCentavos).toBe(totalCentavos);
      expect(Number.isInteger(sinalCentavos)).toBe(true);
    },
  );

  it('experiência gratuita não tem sinal', () => {
    expect(splitPayment(0, 4)).toEqual({
      totalCentavos: 0,
      sinalCentavos: 0,
      restanteCentavos: 0,
    });
  });

  it.each([
    [-1, 1],
    [10.5, 1],
    [100, 0],
    [100, 1.5],
  ])(
    'recusa valor %s ou participantes %s fora do formato',
    (valor, pessoas) => {
      expect(() => splitPayment(valor, pessoas)).toThrow(RangeError);
    },
  );
});

describe('pagamento da pré-reserva — sinalDeadline', () => {
  it('vence 24 horas depois do aceite', () => {
    expect(sinalDeadline(new Date('2026-11-20T14:00:00.000Z'))).toEqual(
      new Date('2026-11-21T14:00:00.000Z'),
    );
  });
});

describe('pagamento da pré-reserva — effectivePaymentStatus', () => {
  const prazoSinal = new Date('2026-11-21T14:00:00.000Z');
  const antes = new Date('2026-11-21T13:59:59.000Z');
  const depois = new Date('2026-11-21T14:00:01.000Z');

  it('aguardando sinal dentro do prazo continua aguardando', () => {
    expect(
      effectivePaymentStatus(
        { situacao: PaymentStatus.AGUARDANDO_SINAL, prazoSinal },
        antes,
      ),
    ).toBe(PaymentStatus.AGUARDANDO_SINAL);
  });

  it('aguardando sinal depois do prazo está expirado', () => {
    expect(
      effectivePaymentStatus(
        { situacao: PaymentStatus.AGUARDANDO_SINAL, prazoSinal },
        depois,
      ),
    ).toBe(PaymentStatus.EXPIRADO);
  });

  it.each([
    PaymentStatus.COMPROVANTE_ENVIADO,
    PaymentStatus.SINAL_CONFIRMADO,
    PaymentStatus.DISPENSADO,
    PaymentStatus.EXPIRADO,
  ])('%s não muda com o prazo', (situacao) => {
    expect(effectivePaymentStatus({ situacao, prazoSinal }, depois)).toBe(
      situacao,
    );
  });

  it('sem prazo registrado, nunca expira', () => {
    expect(
      effectivePaymentStatus(
        { situacao: PaymentStatus.AGUARDANDO_SINAL },
        depois,
      ),
    ).toBe(PaymentStatus.AGUARDANDO_SINAL);
  });
});
