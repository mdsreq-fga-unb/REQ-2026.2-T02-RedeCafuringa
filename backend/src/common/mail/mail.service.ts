export interface MailMessage {
  /** Destinatário único. */
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Porta de saída de e-mail. Os services dependem desta classe, não do
 * provedor, para os testes trocarem o envio por um falso (RNF13: sem custo).
 */
export abstract class MailService {
  abstract send(message: MailMessage): Promise<void>;
}
