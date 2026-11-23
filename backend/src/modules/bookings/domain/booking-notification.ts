/**
 * Link de consulta da pré-reserva enviado nos e-mails da HU48/RF48.
 *
 * O app usa rotas por âncora (`/#/reservas/:id`), então o link é montado a
 * partir de `APP_PUBLIC_URL` sem perder um eventual caminho publicado.
 */

import { BookingStatus } from './booking.js';

const STATUS_TEXT: Record<BookingStatus, string> = {
  [BookingStatus.PENDENTE]: 'pendente',
  [BookingStatus.ACEITA]: 'aceita',
  [BookingStatus.RECUSADA]: 'recusada',
  [BookingStatus.CANCELADA]: 'cancelada',
};

/** Texto da situação nos e-mails, desacoplado do valor gravado no banco. */
export function bookingStatusText(status: BookingStatus): string {
  return STATUS_TEXT[status];
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** RNF10: https sempre; http apenas em endereço local de desenvolvimento. */
function isAllowedBase(url: URL): boolean {
  if (url.protocol === 'https:') return true;
  return url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname);
}

/**
 * Devolve o link para a consulta da pré-reserva ou `null` quando
 * `APP_PUBLIC_URL` está ausente, malformada ou insegura. Nunca lança: a
 * ausência de link não pode impedir o aviso (CA02, CA07).
 */
export function buildBookingConsultationLink(
  appUrl: string | undefined,
  bookingId: string,
  options: { producer?: boolean } = {},
): string | null {
  const base = appUrl?.trim();
  if (!base) return null;

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (!isAllowedBase(url)) return null;

  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  const profile = options.producer ? '&perfil=producer' : '';
  url.hash = `/reservas/${encodeURIComponent(bookingId)}?origem=notificacoes${profile}`;
  return url.href;
}
