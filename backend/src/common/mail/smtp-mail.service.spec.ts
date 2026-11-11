import { LogMailService } from './log-mail.service.js';
import { SmtpMailService } from './smtp-mail.service.js';

const message = {
  to: 'maria@exemplo.com',
  subject: 'Assunto',
  text: 'Corpo em texto',
  html: '<p>Corpo</p>',
};

describe('HU10/RNF10 — envio de e-mail', () => {
  describe('SmtpMailService', () => {
    it('envia pelo transporte com remetente fixo e destinatário único', async () => {
      const sendMail = vi.fn().mockResolvedValue({ messageId: 'x' });
      const mail = new SmtpMailService(
        { sendMail },
        'Rede Cafuringa <nao-responda@cafuringa.example>',
      );

      await mail.send(message);

      expect(sendMail).toHaveBeenCalledExactlyOnceWith({
        from: 'Rede Cafuringa <nao-responda@cafuringa.example>',
        to: 'maria@exemplo.com',
        subject: 'Assunto',
        text: 'Corpo em texto',
        html: '<p>Corpo</p>',
      });
    });

    it('propaga a falha do transporte para quem chamou decidir', async () => {
      const sendMail = vi.fn().mockRejectedValue(new Error('SMTP fora'));
      const mail = new SmtpMailService({ sendMail }, 'a@b.co');

      await expect(mail.send(message)).rejects.toThrow('SMTP fora');
    });

    it('recusa destinatário com quebra de linha (injeção de cabeçalho)', async () => {
      const sendMail = vi.fn();
      const mail = new SmtpMailService({ sendMail }, 'a@b.co');

      await expect(
        mail.send({ ...message, to: 'a@b.co\r\nBcc: vitima@x.com' }),
      ).rejects.toThrow();
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('recusa assunto com quebra de linha (injeção de cabeçalho)', async () => {
      const sendMail = vi.fn();
      const mail = new SmtpMailService({ sendMail }, 'a@b.co');

      await expect(
        mail.send({ ...message, subject: 'Oi\nBcc: vitima@x.com' }),
      ).rejects.toThrow();
      expect(sendMail).not.toHaveBeenCalled();
    });
  });

  describe('LogMailService (somente desenvolvimento)', () => {
    it('registra o e-mail inteiro para o desenvolvedor abrir o link', async () => {
      const logger = { log: vi.fn() };
      const mail = new LogMailService(logger);

      await mail.send(message);

      expect(logger.log).toHaveBeenCalledOnce();
      const [logged] = logger.log.mock.calls[0] as [string];
      expect(logged).toContain('maria@exemplo.com');
      expect(logged).toContain('Corpo em texto');
    });
  });
});
