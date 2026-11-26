/**
 * Cancelamento com sinal (pagamento por Pix; RN20 revista em 25/11/2026: a
 * consumidora também cancela depois do aceite). A plataforma não devolve
 * dinheiro: decide e registra se a produtora deve devolver o sinal.
 */
import { PaymentStatus } from './booking-payment.js';

/** Cancelando com pelo menos esta antecedência, a consumidora recebe o sinal de volta. */
export const CANCELAMENTO_COM_DEVOLUCAO_HORAS = 72;

/** Brasília não tem horário de verão desde 2019: UTC-3 o ano todo. */
const BRASILIA_OFFSET = '-03:00';
const HORA_MS = 60 * 60 * 1000;

/** O sinal já saiu da conta da consumidora (avisado ou confirmado). */
const PAID = new Set([
  PaymentStatus.COMPROVANTE_ENVIADO,
  PaymentStatus.SINAL_CONFIRMADO,
  PaymentStatus.PAGAMENTO_RECEBIDO,
]);

export type QuemCancela = 'consumidora' | 'produtora';
/** `sem-sinal`: nada pago; `devolver`: a produtora devolve; `retido`: fica com ela. */
export type SinalNoCancelamento = 'sem-sinal' | 'devolver' | 'retido';

/** Horas que faltam para a experiência (negativo se já começou). */
export function hoursUntilExperience(
  data: string,
  horario: string,
  agora: Date = new Date(),
): number {
  const inicio = new Date(`${data}T${horario}:00${BRASILIA_OFFSET}`);
  return (inicio.getTime() - agora.getTime()) / HORA_MS;
}

export function cancellationOutcome({
  quemCancela,
  data,
  horario,
  pagamento,
  agora = new Date(),
}: {
  quemCancela: QuemCancela;
  data: string;
  horario: string;
  pagamento?: { situacao: PaymentStatus; sinalCentavos: number };
  agora?: Date;
}): { sinal: SinalNoCancelamento; valorCentavos: number } {
  if (!pagamento || !PAID.has(pagamento.situacao))
    return { sinal: 'sem-sinal', valorCentavos: 0 };
  const devolve =
    quemCancela === 'produtora' ||
    hoursUntilExperience(data, horario, agora) >=
      CANCELAMENTO_COM_DEVOLUCAO_HORAS;
  return {
    sinal: devolve ? 'devolver' : 'retido',
    valorCentavos: pagamento.sinalCentavos,
  };
}
