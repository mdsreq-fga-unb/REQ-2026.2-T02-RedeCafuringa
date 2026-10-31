import type { VitePWAOptions } from "vite-plugin-pwa";

export type RuntimeCachingRule = NonNullable<
    NonNullable<VitePWAOptions["workbox"]>["runtimeCaching"]
>[number];

/**
 * Plugin do Workbox: não grava no cache respostas de requisições autenticadas.
 *
 * Atenção: o Workbox serializa esta função (toString) para dentro do sw.js, então ela
 * precisa ser autocontida: sem imports nem variáveis de fora. O teste confere isso.
 */
export const skipAuthenticatedResponses = {
    cacheWillUpdate: async ({
        request,
        response,
    }: {
        request: Request;
        response: Response;
    }) => (request.headers.has("authorization") ? null : response),
};

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Regra de cache em tempo de execução para a API (NetworkFirst: tenta a rede e cai no cache
 * se estiver offline). Cuidados com privacidade (LGPD) e correção:
 *  - só GET: o Workbox nunca cacheia POST/PUT/PATCH/DELETE;
 *  - nunca cacheia /auth/* (sessão e dados da pessoa);
 *  - nunca grava resposta de requisição com Authorization (dados pessoais ficariam no
 *    aparelho depois do logout); cacheia só dados públicos, como o catálogo;
 *  - só status 200 e no máximo 50 itens por 24 h.
 *
 * Sem URL de API válida (ou em mesma origem), não há o que cachear: devolve undefined.
 */
export function apiCacheRule(apiUrl: string): RuntimeCachingRule | undefined {
    let base: URL;
    try {
        base = new URL(apiUrl);
    } catch {
        return undefined;
    }
    if (base.protocol !== "http:" && base.protocol !== "https:") {
        return undefined;
    }

    const prefix = escapeRegExp(
        `${base.origin}${base.pathname.replace(/\/+$/, "")}/`,
    );

    return {
        urlPattern: new RegExp(`^${prefix}(?!auth/)`),
        method: "GET",
        handler: "NetworkFirst",
        options: {
            cacheName: "api-get-public",
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            cacheableResponse: { statuses: [200] },
            plugins: [skipAuthenticatedResponses],
        },
    };
}
