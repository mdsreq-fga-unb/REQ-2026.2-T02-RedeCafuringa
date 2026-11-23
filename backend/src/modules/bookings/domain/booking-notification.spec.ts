import { BookingStatus } from './booking.js';
import {
  bookingStatusText,
  buildBookingConsultationLink,
} from './booking-notification.js';

const ID = '665f1c2e9b1d4a0012ab34c1';

describe('HU48/RF48 — texto da situação nos e-mails', () => {
  it.each([
    [BookingStatus.ACEITA, 'aceita'],
    [BookingStatus.RECUSADA, 'recusada'],
    [BookingStatus.CANCELADA, 'cancelada'],
    [BookingStatus.PENDENTE, 'pendente'],
  ])(
    'descreve %s por extenso, sem depender do valor gravado',
    (status, text) => {
      expect(bookingStatusText(status)).toBe(text);
    },
  );
});

describe('HU48/RF48 — link de consulta enviado por e-mail', () => {
  it('CA05: aponta para o detalhe da pré-reserva a partir da origem das notificações', () => {
    expect(buildBookingConsultationLink('https://app.example.test', ID)).toBe(
      `https://app.example.test/#/reservas/${ID}?origem=notificacoes`,
    );
  });

  it('identifica o perfil do produtor para o app abrir a visão certa', () => {
    expect(
      buildBookingConsultationLink('https://app.example.test', ID, {
        producer: true,
      }),
    ).toBe(
      `https://app.example.test/#/reservas/${ID}?origem=notificacoes&perfil=producer`,
    );
  });

  it.each(['https://app.example.test/app', 'https://app.example.test/app/'])(
    'preserva o caminho publicado (%s)',
    (base) => {
      expect(buildBookingConsultationLink(base, ID)).toBe(
        `https://app.example.test/app/#/reservas/${ID}?origem=notificacoes`,
      );
    },
  );

  it('descarta consulta e âncora que a URL configurada já tenha', () => {
    expect(
      buildBookingConsultationLink('https://app.example.test/?x=1#/outra', ID),
    ).toBe(`https://app.example.test/#/reservas/${ID}?origem=notificacoes`);
  });

  it('RNF10: aceita http apenas em endereço local de desenvolvimento', () => {
    expect(buildBookingConsultationLink('http://localhost:5173', ID)).toBe(
      `http://localhost:5173/#/reservas/${ID}?origem=notificacoes`,
    );
    expect(
      buildBookingConsultationLink('http://app.example.test', ID),
    ).toBeNull();
  });

  it.each([undefined, '', '   ', 'não é uma url', 'ftp://app.example.test'])(
    'CA07: não lança e não gera link quando a URL é inválida (%s)',
    (base) => {
      expect(buildBookingConsultationLink(base, ID)).toBeNull();
    },
  );
});
