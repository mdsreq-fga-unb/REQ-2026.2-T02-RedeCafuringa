import {
  CANCELAMENTO_COM_DEVOLUCAO_HORAS,
  cancellationOutcome,
  hoursUntilExperience,
} from './booking-cancellation.js';
import { PaymentStatus } from './booking-payment.js';

// Experiência em 20/12/2026 às 09:00 de Brasília (12:00 UTC).
const data = '2026-12-20';
const horario = '09:00';
const pago = (situacao = PaymentStatus.SINAL_CONFIRMADO) => ({
  situacao,
  sinalCentavos: 9100,
});
const at = (iso: string) => new Date(iso);

describe('cancelamento com sinal — prazo', () => {
  it('devolução até 72 horas antes da experiência', () => {
    expect(CANCELAMENTO_COM_DEVOLUCAO_HORAS).toBe(72);
  });

  it('conta as horas até a experiência no horário de Brasília', () => {
    expect(
      hoursUntilExperience(data, horario, at('2026-12-17T12:00:00.000Z')),
    ).toBe(72);
    expect(
      hoursUntilExperience(data, horario, at('2026-12-20T13:00:00.000Z')),
    ).toBe(-1);
  });
});

describe('cancelamento com sinal — cancellationOutcome', () => {
  it.each([
    ['sem pagamento (pendente)', undefined],
    ['sinal ainda por pagar', pago(PaymentStatus.AGUARDANDO_SINAL)],
    ['prazo do sinal vencido', pago(PaymentStatus.EXPIRADO)],
    ['sinal dispensado', pago(PaymentStatus.DISPENSADO)],
  ])('%s: não há sinal a devolver', (_caso, pagamento) => {
    expect(
      cancellationOutcome({
        quemCancela: 'consumidora',
        data,
        horario,
        pagamento,
        agora: at('2026-12-19T12:00:00.000Z'),
      }),
    ).toEqual({ sinal: 'sem-sinal', valorCentavos: 0 });
  });

  it.each([
    ['exatamente 72 horas antes', '2026-12-17T12:00:00.000Z'],
    ['com uma semana de antecedência', '2026-12-13T12:00:00.000Z'],
  ])('consumidora cancela %s: a produtora devolve o sinal', (_caso, agora) => {
    expect(
      cancellationOutcome({
        quemCancela: 'consumidora',
        data,
        horario,
        pagamento: pago(),
        agora: at(agora),
      }),
    ).toEqual({ sinal: 'devolver', valorCentavos: 9100 });
  });

  it.each([
    ['71 horas antes', '2026-12-17T13:00:00.000Z'],
    ['no próprio dia', '2026-12-20T10:00:00.000Z'],
  ])('consumidora cancela %s: o sinal fica com a produtora', (_caso, agora) => {
    expect(
      cancellationOutcome({
        quemCancela: 'consumidora',
        data,
        horario,
        pagamento: pago(),
        agora: at(agora),
      }),
    ).toEqual({ sinal: 'retido', valorCentavos: 9100 });
  });

  it('comprovante enviado conta como pago: a regra vale igual', () => {
    expect(
      cancellationOutcome({
        quemCancela: 'consumidora',
        data,
        horario,
        pagamento: pago(PaymentStatus.COMPROVANTE_ENVIADO),
        agora: at('2026-12-19T12:00:00.000Z'),
      }),
    ).toEqual({ sinal: 'retido', valorCentavos: 9100 });
  });

  it('produtora cancela: devolve o sinal, a qualquer momento', () => {
    expect(
      cancellationOutcome({
        quemCancela: 'produtora',
        data,
        horario,
        pagamento: pago(),
        agora: at('2026-12-20T11:00:00.000Z'),
      }),
    ).toEqual({ sinal: 'devolver', valorCentavos: 9100 });
  });
});
