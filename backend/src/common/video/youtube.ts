/**
 * Vídeo do YouTube nas ofertas e na trajetória.
 *
 * O produtor envia um link; a API guarda só o id do vídeo. Nunca se guarda
 * HTML nem endereço arbitrário: o front monta o embed a partir do id, no
 * domínio sem cookies. As regras são as mesmas do app (features/video).
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Links reais têm bem menos que isso; acima, nem se analisa. */
export const VIDEO_URL_MAX = 2048;

const WATCH_HOSTS = new Set(['youtube.com', 'm.youtube.com']);
const EMBED_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
]);

export const VIDEO_URL_ERROR =
  'Cole um link de vídeo do YouTube, como https://www.youtube.com/watch?v=…';

function validId(id: string | null | undefined): string | null {
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Id do vídeo, ou null se o valor não for um link do YouTube válido. */
export function extractYoutubeId(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > VIDEO_URL_MAX) return null;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  // A URL já devolve o host em minúsculas.
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') return validId(url.pathname.slice(1));

  const path = /^\/(embed|shorts)\/([^/]+)\/?$/.exec(url.pathname);
  if (path) {
    const allowed = path[1] === 'embed' ? EMBED_HOSTS : WATCH_HOSTS;
    return allowed.has(host) ? validId(path[2]) : null;
  }
  if (WATCH_HOSTS.has(host) && url.pathname === '/watch')
    return validId(url.searchParams.get('v'));
  return null;
}
