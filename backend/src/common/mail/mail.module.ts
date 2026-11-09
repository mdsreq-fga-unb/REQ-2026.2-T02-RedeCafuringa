import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { LogMailService } from './log-mail.service.js';
import { MailService } from './mail.service.js';
import { SmtpMailService } from './smtp-mail.service.js';

/** Escolhe o transporte pela configuração: `log` (dev/test) ou `smtp`. */
@Global()
@Module({
  providers: [
    {
      provide: MailService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailService => {
        if (config.get<string>('MAIL_TRANSPORT', 'log') === 'log') {
          return new LogMailService(new Logger('Mail'));
        }

        const user = config.get<string>('SMTP_USER');
        const port = config.get<number>('SMTP_PORT', 587);
        const transport = createTransport({
          host: config.getOrThrow<string>('SMTP_HOST'),
          port,
          // 465 usa TLS direto. Nas demais portas, em produção, o STARTTLS é
          // obrigatório (RNF10); em dev permite um SMTP local sem TLS (Mailpit).
          secure: port === 465,
          requireTLS:
            port !== 465 && config.get<string>('NODE_ENV') === 'production',
          auth: user
            ? { user, pass: config.getOrThrow<string>('SMTP_PASSWORD') }
            : undefined,
        });

        return new SmtpMailService(
          transport,
          config.getOrThrow<string>('MAIL_FROM'),
        );
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
