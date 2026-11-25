import { BookingStatus } from './booking.js';
import {
  type PaymentAction,
  paymentActionError,
  PaymentStatus,
  PRAZO_SINAL_HORAS,
  SINAL_PERCENTUAL,
  effectivePaymentStatus,
  paymentView,
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

describe('pagamento da pré-reserva — paymentActionError', () => {
  const agora = new Date('2026-11-21T12:00:00.000Z');
  const prazoSinal = new Date('2026-11-22T12:00:00.000Z');
  const vencido = new Date('2026-11-20T12:00:00.000Z');
  const aceita = (situacao: PaymentStatus, prazo = prazoSinal) => ({
    status: BookingStatus.ACEITA,
    pagamento: { situacao, prazoSinal: prazo },
  });

  it.each<[PaymentAction, ReturnType<typeof aceita>]>([
    ['enviar-comprovante', aceita(PaymentStatus.AGUARDANDO_SINAL)],
    ['confirmar-sinal', aceita(PaymentStatus.AGUARDANDO_SINAL)],
    ['confirmar-sinal', aceita(PaymentStatus.COMPROVANTE_ENVIADO)],
    // Pagou depois do prazo: a produtora ainda pode confirmar.
    ['confirmar-sinal', aceita(PaymentStatus.AGUARDANDO_SINAL, vencido)],
    ['nao-encontrado', aceita(PaymentStatus.COMPROVANTE_ENVIADO)],
  ])('%s é permitido em %j', (acao, estado) => {
    expect(paymentActionError(acao, estado, agora)).toBeNull();
  });

  it.each<[PaymentAction, object, string]>([
    [
      'enviar-comprovante',
      { status: BookingStatus.PENDENTE },
      'Só é possível avisar o pagamento de uma pré-reserva aceita.',
    ],
    [
      'confirmar-sinal',
      {
        status: BookingStatus.CANCELADA,
        pagamento: { situacao: PaymentStatus.AGUARDANDO_SINAL },
      },
      'Só é possível confirmar o sinal de uma pré-reserva aceita.',
    ],
    [
      'nao-encontrado',
      { status: BookingStatus.RECUSADA },
      'Só é possível contestar o pagamento de uma pré-reserva aceita.',
    ],
    [
      'enviar-comprovante',
      { status: BookingStatus.ACEITA },
      'Esta pré-reserva não pede sinal.',
    ],
    [
      'confirmar-sinal',
      aceita(PaymentStatus.DISPENSADO),
      'Esta pré-reserva não pede sinal.',
    ],
    [
      'enviar-comprovante',
      aceita(PaymentStatus.AGUARDANDO_SINAL, vencido),
      'O prazo para pagar o sinal terminou. Fale com a produtora.',
    ],
    [
      'enviar-comprovante',
      aceita(PaymentStatus.COMPROVANTE_ENVIADO),
      'Você já avisou que pagou o sinal. A produtora vai conferir.',
    ],
    [
      'enviar-comprovante',
      aceita(PaymentStatus.SINAL_CONFIRMADO),
      'O sinal desta pré-reserva já foi confirmado.',
    ],
    [
      'confirmar-sinal',
      aceita(PaymentStatus.SINAL_CONFIRMADO),
      'O sinal desta pré-reserva já foi confirmado.',
    ],
    [
      'nao-encontrado',
      aceita(PaymentStatus.AGUARDANDO_SINAL),
      'A consumidora ainda não avisou que pagou o sinal.',
    ],
    [
      'nao-encontrado',
      aceita(PaymentStatus.SINAL_CONFIRMADO),
      'O sinal desta pré-reserva já foi confirmado.',
    ],
  ])('%s em %j: %s', (acao, estado, mensagem) => {
    expect(
      paymentActionError(
        acao,
        estado as Parameters<typeof paymentActionError>[1],
        agora,
      ),
    ).toBe(mensagem);
  });
});

describe('pagamento da pré-reserva — devolução no paymentView', () => {
  const base = {
    totalCentavos: 18200,
    sinalCentavos: 9100,
    restanteCentavos: 9100,
    situacao: PaymentStatus.SINAL_CONFIRMADO,
  };

  it.each([
    [{ sinalNoCancelamento: 'devolver' as const }, 'pendente'],
    [
      {
        sinalNoCancelamento: 'devolver' as const,
        devolvidoEm: new Date('2026-11-23T12:00:00.000Z'),
      },
      'feita',
    ],
    [{ sinalNoCancelamento: 'retido' as const }, 'retido'],
  ])('%j aparece como devolução %s', (cancelamento, devolucao) => {
    expect(paymentView({ ...base, ...cancelamento }).devolucao).toBe(devolucao);
  });

  it('sem cancelamento, não há devolução', () => {
    expect(paymentView(base)).not.toHaveProperty('devolucao');
  });
});

describe('pagamento da pré-reserva — sem sinal e pagamento recebido', () => {
  const agora = new Date('2026-11-21T12:00:00.000Z');
  const aceita = (situacao: PaymentStatus, prazoSinal?: Date) => ({
    status: BookingStatus.ACEITA,
    pagamento: { situacao, ...(prazoSinal ? { prazoSinal } : {}) },
  });

  it.each<[PaymentAction, ReturnType<typeof aceita>]>([
    [
      'dispensar-sinal',
      aceita(
        PaymentStatus.AGUARDANDO_SINAL,
        new Date('2026-11-22T12:00:00.000Z'),
      ),
    ],
    // Prazo vencido: a produtora ainda pode garantir a vaga sem sinal.
    [
      'dispensar-sinal',
      aceita(
        PaymentStatus.AGUARDANDO_SINAL,
        new Date('2026-11-20T12:00:00.000Z'),
      ),
    ],
    ['registrar-pagamento', aceita(PaymentStatus.SINAL_CONFIRMADO)],
    ['registrar-pagamento', aceita(PaymentStatus.DISPENSADO)],
  ])('%s é permitido em %j', (acao, estado) => {
    expect(paymentActionError(acao, estado, agora)).toBeNull();
  });

  it.each<[PaymentAction, object, string]>([
    [
      'dispensar-sinal',
      { status: BookingStatus.PENDENTE },
      'Só é possível dispensar o sinal de uma pré-reserva aceita.',
    ],
    [
      'dispensar-sinal',
      aceita(PaymentStatus.DISPENSADO),
      'O sinal desta pré-reserva já foi dispensado.',
    ],
    [
      'dispensar-sinal',
      aceita(PaymentStatus.COMPROVANTE_ENVIADO),
      'A consumidora avisou que pagou: confira o extrato e confirme o sinal.',
    ],
    [
      'dispensar-sinal',
      aceita(PaymentStatus.SINAL_CONFIRMADO),
      'O sinal desta pré-reserva já foi confirmado.',
    ],
    [
      'registrar-pagamento',
      {
        status: BookingStatus.CANCELADA,
        pagamento: { situacao: PaymentStatus.SINAL_CONFIRMADO },
      },
      'Só é possível registrar o pagamento de uma pré-reserva aceita.',
    ],
    [
      'registrar-pagamento',
      aceita(
        PaymentStatus.AGUARDANDO_SINAL,
        new Date('2026-11-22T12:00:00.000Z'),
      ),
      'Confirme ou dispense o sinal antes de registrar o pagamento.',
    ],
    [
      'registrar-pagamento',
      aceita(PaymentStatus.PAGAMENTO_RECEBIDO),
      'O pagamento desta pré-reserva já foi registrado.',
    ],
    [
      'registrar-pagamento',
      { status: BookingStatus.ACEITA },
      'Esta pré-reserva não tem pagamento registrado.',
    ],
    [
      'enviar-comprovante',
      aceita(PaymentStatus.PAGAMENTO_RECEBIDO),
      'O pagamento desta pré-reserva já foi registrado.',
    ],
  ])('%s em %j: %s', (acao, estado, mensagem) => {
    expect(
      paymentActionError(
        acao,
        estado as Parameters<typeof paymentActionError>[1],
        agora,
      ),
    ).toBe(mensagem);
  });
});
