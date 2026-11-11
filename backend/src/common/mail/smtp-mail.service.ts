import { MailMessage, MailService } from './mail.service.js';

/** Subconjunto do transporte do nodemailer que usamos (facilita o teste). */
export interface MailTransport {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<unknown>;
}

const LINE_BREAK = /[\r\n]/;

/** Envio real por SMTP (ex.: Brevo gratuito, D6). */
export class SmtpMailService extends MailService {
  constructor(
    private readonly transport: MailTransport,
    private readonly from: string,
  ) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    // Quebra de linha em cabeçalho permitiria injetar Bcc/Cc (header injection).
    if (LINE_BREAK.test(message.to) || LINE_BREAK.test(message.subject)) {
      throw new Error('Cabeçalho de e-mail inválido');
    }

    await this.transport.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });
  }
}
