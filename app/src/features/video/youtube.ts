/**
 * Vídeo do YouTube nas ofertas e na trajetória.
 *
 * O usuário cola um link; só o id do vídeo é aproveitado. Nunca se aceita
 * HTML (iframe colado) nem endereço arbitrário: o embed é sempre montado
 * aqui, no domínio sem cookies de rastreio.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const WATCH_HOSTS = new Set(["youtube.com", "m.youtube.com"]);
const EMBED_HOSTS = new Set([
    "youtube.com",
    "m.youtube.com",
    "youtube-nocookie.com",
]);

export const VIDEO_URL_ERROR =
    "Cole um link de vídeo do YouTube, como https://www.youtube.com/watch?v=…";

function validId(id: string | null | undefined): string | null {
    return id && YOUTUBE_ID.test(id) ? id : null;
}

export function extractYoutubeId(input: string): string | null {
    let url: URL;
    try {
        url = new URL(input.trim());
    } catch {
        return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") return validId(url.pathname.slice(1));

    const path = url.pathname.match(/^\/(embed|shorts)\/([^/]+)\/?$/);
    if (path) {
        const allowed = path[1] === "embed" ? EMBED_HOSTS : WATCH_HOSTS;
        return allowed.has(host) ? validId(path[2]) : null;
    }
    if (WATCH_HOSTS.has(host) && url.pathname === "/watch")
        return validId(url.searchParams.get("v"));
    return null;
}

/** Vazio é válido (o vídeo é opcional); link fora do padrão recebe orientação. */
export function validateVideoUrl(value: string): string | undefined {
    if (!value.trim()) return undefined;
    return extractYoutubeId(value) ? undefined : VIDEO_URL_ERROR;
}

export function youtubeEmbedUrl(id: string): string | null {
    const valid = validId(id);
    return valid ? `https://www.youtube-nocookie.com/embed/${valid}` : null;
}
