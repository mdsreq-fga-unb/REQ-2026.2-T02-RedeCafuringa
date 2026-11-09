import { MailMessage, MailService } from './mail.service.js';

/**
 * Só para desenvolvimento e testes: escreve o e-mail no log, para quem
 * desenvolve abrir o link de recuperação sem um servidor SMTP. A configuração
 * recusa este transporte em produção (o log exibiria o token).
 */
export class LogMailService extends MailService {
  constructor(private readonly logger: { log(message: string): void }) {
    super();
  }

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `[e-mail de desenvolvimento] para=${message.to} assunto="${message.subject}"\n${message.text}`,
    );
    return Promise.resolve();
  }
}
