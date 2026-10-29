/**
 * Content-Security-Policy da imagem de produção.
 *
 * Gerada no build do Docker (nginx/gen-csp.ts) porque a origem da API só é conhecida
 * nesse momento (VITE_API_URL) e o nginx roda com o sistema de arquivos somente leitura.
 * Importa só tipos nativos: roda com `node nginx/gen-csp.ts` (Node 24 remove os tipos).
 */

/**
 * Hosts de imagem permitidos além de 'self'. Hoje: fotos de exemplo do Unsplash, fixas em
 * features/offers/offerData.ts e features/profile/ProfilePage.tsx. Remova quando as imagens
 * passarem a vir da API ou do próprio app.
 */
export const IMAGE_HOSTS: readonly string[] = ["https://images.unsplash.com"];

/** Origem (esquema + host + porta) da API, ou undefined se a URL não for http(s) válida. */
export function apiOrigin(apiUrl: string | undefined): string | undefined {
    const value = (apiUrl ?? "").trim();
    if (!value) return undefined;
    try {
        const url = new URL(value);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return url.origin;
        }
    } catch {
        // URL inválida: sem origem extra, o connect-src fica só 'self'.
    }
    return undefined;
}

export type CspOptions = {
    /** VITE_API_URL do build. */
    apiUrl?: string;
    imageHosts?: readonly string[];
};

export function buildCsp({
    apiUrl,
    imageHosts = IMAGE_HOSTS,
}: CspOptions = {}): string {
    const api = apiOrigin(apiUrl);
    const directives: Record<string, string[]> = {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        // O app não usa estilos inline; o CSS vai num arquivo.
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:", ...imageHosts],
        "font-src": ["'self'"],
        "connect-src": ["'self'", ...(api ? [api] : [])],
        "manifest-src": ["'self'"],
        "worker-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
    };
    return Object.entries(directives)
        .map(([name, sources]) => `${name} ${sources.join(" ")}`)
        .join("; ");
}

/** Diretiva pronta para o nginx. */
export function cspSnippet(options: CspOptions = {}): string {
    return `add_header Content-Security-Policy "${buildCsp(options)}" always;\n`;
}
