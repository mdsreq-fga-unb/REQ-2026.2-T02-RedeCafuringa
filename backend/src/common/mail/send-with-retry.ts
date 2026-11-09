import type { MailMessage } from './mail.service.js';

export interface DeliveryResult {
  delivered: boolean;
  attempts: number;
  /** Só o nome do erro (ex.: `Error`), nunca a mensagem: pode conter o e-mail. */
  errorName?: string;
}

const realSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Tenta enviar e, a cada falha, espera o próximo intervalo de `delaysMs` e tenta
 * de novo (1 + N tentativas). Nunca lança: devolve o resultado para quem chamou
 * registrar a falha. Cobre quedas passageiras do SMTP; uma fila persistente
 * (outbox, D6) fica para quando houver mais tipos de e-mail.
 */
export async function sendWithRetry(
  send: (message: MailMessage) => Promise<void>,
  message: MailMessage,
  delaysMs: readonly number[],
  sleep: (ms: number) => Promise<void> = realSleep,
): Promise<DeliveryResult> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= delaysMs.length + 1; attempt++) {
    try {
      await send(message);
      return { delivered: true, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt <= delaysMs.length) await sleep(delaysMs[attempt - 1]);
    }
  }

  return {
    delivered: false,
    attempts: delaysMs.length + 1,
    errorName: lastError instanceof Error ? lastError.name : 'Erro',
  };
}

/** `"2000,10000"` → `[2000, 10000]`; vazio ou ausente → sem reenvio. */
export function parseRetryDelays(raw: string | undefined): number[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((part) => Number(part.trim()));
}
