/**
 * Pagamento da pré-reserva por Pix (proposta do pagamento por Pix): no aceite,
 * a consumidora tem um prazo para pagar o sinal direto à produtora. A
 * plataforma não recebe nem guarda dinheiro; só organiza valores e prazos.
 *
 * A situação do pagamento fica separada da situação da pré-reserva (`status`),
 * para não mudar as listas, o detalhe e as notificações que já existem.
 */

/** Parte do total paga antes, para garantir a vaga. */
export const SINAL_PERCENTUAL = 50;
/** Prazo para pagar o sinal depois do aceite. */
export const PRAZO_SINAL_HORAS = 24;

const HORA_MS = 60 * 60 * 1000;

export enum PaymentStatus {
  AGUARDANDO_SINAL = 'aguardando-sinal',
  COMPROVANTE_ENVIADO = 'comprovante-enviado',
  SINAL_CONFIRMADO = 'sinal-confirmado',
  EXPIRADO = 'expirado',
  DISPENSADO = 'dispensado',
}

export type PaymentSplit = {
  totalCentavos: number;
  sinalCentavos: number;
  restanteCentavos: number;
};

/**
 * Divide o total em sinal e restante. O centavo que sobra fica no sinal,
 * e a soma sempre fecha o total.
 */
export function splitPayment(
  valorPorPessoaCentavos: number,
  participantes: number,
): PaymentSplit {
  if (
    !Number.isSafeInteger(valorPorPessoaCentavos) ||
    valorPorPessoaCentavos < 0
  )
    throw new RangeError('Valor por pessoa deve ser um inteiro de centavos');
  if (!Number.isSafeInteger(participantes) || participantes < 1)
    throw new RangeError('Participantes deve ser um inteiro maior que zero');
  const totalCentavos = valorPorPessoaCentavos * participantes;
  const sinalCentavos = Math.ceil((totalCentavos * SINAL_PERCENTUAL) / 100);
  return {
    totalCentavos,
    sinalCentavos,
    restanteCentavos: totalCentavos - sinalCentavos,
  };
}

export function sinalDeadline(aceitaEm: Date): Date {
  return new Date(aceitaEm.getTime() + PRAZO_SINAL_HORAS * HORA_MS);
}

/**
 * Situação valendo agora: o prazo é conferido na leitura e em cada ação,
 * sem tarefa agendada. Só quem ainda não pagou nem enviou comprovante expira.
 */
export function effectivePaymentStatus(
  pagamento: { situacao: PaymentStatus; prazoSinal?: Date },
  agora: Date = new Date(),
): PaymentStatus {
  if (
    pagamento.situacao === PaymentStatus.AGUARDANDO_SINAL &&
    pagamento.prazoSinal &&
    agora.getTime() > pagamento.prazoSinal.getTime()
  )
    return PaymentStatus.EXPIRADO;
  return pagamento.situacao;
}
