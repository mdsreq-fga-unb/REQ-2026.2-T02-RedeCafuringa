/**
 * Pagamento da pré-reserva por Pix (proposta do pagamento por Pix): no aceite,
 * a consumidora tem um prazo para pagar o sinal direto à produtora. A
 * plataforma não recebe nem guarda dinheiro; só organiza valores e prazos.
 *
 * A situação do pagamento fica separada da situação da pré-reserva (`status`),
 * para não mudar as listas, o detalhe e as notificações que já existem.
 */
import { BookingStatus } from './booking.js';

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
  /** A produtora registrou que recebeu o valor (sinal e restante, ou tudo no dia). */
  PAGAMENTO_RECEBIDO = 'pagamento-recebido',
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

export type PaymentAction =
  | 'enviar-comprovante'
  | 'confirmar-sinal'
  | 'nao-encontrado'
  | 'dispensar-sinal'
  | 'registrar-pagamento';

const NOT_ACCEPTED: Record<PaymentAction, string> = {
  'enviar-comprovante':
    'Só é possível avisar o pagamento de uma pré-reserva aceita.',
  'confirmar-sinal':
    'Só é possível confirmar o sinal de uma pré-reserva aceita.',
  'nao-encontrado':
    'Só é possível contestar o pagamento de uma pré-reserva aceita.',
  'dispensar-sinal':
    'Só é possível dispensar o sinal de uma pré-reserva aceita.',
  'registrar-pagamento':
    'Só é possível registrar o pagamento de uma pré-reserva aceita.',
};
const NO_DEPOSIT = 'Esta pré-reserva não pede sinal.';
const ALREADY_CONFIRMED = 'O sinal desta pré-reserva já foi confirmado.';

/**
 * Motivo de a ação não valer na situação atual, ou null se vale. A produtora
 * confirma ou dispensa o sinal mesmo depois do prazo (pagou atrasado, ou não
 * usa Pix); a consumidora só avisa o pagamento dentro do prazo.
 */
export function paymentActionError(
  acao: PaymentAction,
  estado: {
    status: BookingStatus;
    pagamento?: { situacao: PaymentStatus; prazoSinal?: Date };
  },
  agora: Date = new Date(),
): string | null {
  if (estado.status !== BookingStatus.ACEITA) return NOT_ACCEPTED[acao];
  const pagamento = estado.pagamento;
  if (!pagamento)
    return acao === 'registrar-pagamento'
      ? 'Esta pré-reserva não tem pagamento registrado.'
      : NO_DEPOSIT;
  if (pagamento.situacao === PaymentStatus.PAGAMENTO_RECEBIDO)
    return 'O pagamento desta pré-reserva já foi registrado.';
  if (acao === 'registrar-pagamento')
    return pagamento.situacao === PaymentStatus.SINAL_CONFIRMADO ||
      pagamento.situacao === PaymentStatus.DISPENSADO
      ? null
      : 'Confirme ou dispense o sinal antes de registrar o pagamento.';
  if (pagamento.situacao === PaymentStatus.DISPENSADO)
    return acao === 'dispensar-sinal'
      ? 'O sinal desta pré-reserva já foi dispensado.'
      : NO_DEPOSIT;
  if (pagamento.situacao === PaymentStatus.SINAL_CONFIRMADO)
    return ALREADY_CONFIRMED;
  const situacao = effectivePaymentStatus(pagamento, agora);
  switch (acao) {
    case 'enviar-comprovante':
      if (situacao === PaymentStatus.EXPIRADO)
        return 'O prazo para pagar o sinal terminou. Fale com a produtora.';
      if (situacao === PaymentStatus.COMPROVANTE_ENVIADO)
        return 'Você já avisou que pagou o sinal. A produtora vai conferir.';
      return null;
    case 'confirmar-sinal':
      return null;
    case 'dispensar-sinal':
      return situacao === PaymentStatus.COMPROVANTE_ENVIADO
        ? 'A consumidora avisou que pagou: confira o extrato e confirme o sinal.'
        : null;
    case 'nao-encontrado':
      return situacao === PaymentStatus.COMPROVANTE_ENVIADO
        ? null
        : 'A consumidora ainda não avisou que pagou o sinal.';
  }
}

/** Pagamento como a API mostra: reais e a situação valendo agora. */
export function paymentView(
  pagamento: {
    totalCentavos: number;
    sinalCentavos: number;
    restanteCentavos: number;
    situacao: PaymentStatus;
    prazoSinal?: Date;
    sinalNoCancelamento?: 'devolver' | 'retido';
    devolvidoEm?: Date;
  },
  agora: Date = new Date(),
) {
  const devolucao =
    pagamento.sinalNoCancelamento === 'retido'
      ? ('retido' as const)
      : pagamento.sinalNoCancelamento === 'devolver'
        ? pagamento.devolvidoEm
          ? ('feita' as const)
          : ('pendente' as const)
        : undefined;
  return {
    total: pagamento.totalCentavos / 100,
    sinal: pagamento.sinalCentavos / 100,
    restante: pagamento.restanteCentavos / 100,
    situacao: effectivePaymentStatus(pagamento, agora),
    ...(pagamento.prazoSinal
      ? { prazoSinal: pagamento.prazoSinal.toISOString() }
      : {}),
    ...(devolucao ? { devolucao } : {}),
  };
}
