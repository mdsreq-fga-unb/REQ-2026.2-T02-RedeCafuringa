import { loadEnv } from "../config/env";
import {
    ApiAbortError,
    ApiConfigError,
    ApiError,
    ApiHttpError,
    ApiNetworkError,
    ApiTimeoutError,
} from "./errors";

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
    query?: Record<string, QueryValue>;
    /** Serializado como JSON. */
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    /** Sobrescreve o tempo limite do cliente nesta chamada. */
    timeoutMs?: number;
    /** false = não envia Authorization (ex.: login). Padrão: envia, se houver token. */
    auth?: boolean;
};

export type ApiClientOptions = {
    /** URL base sem barra final (ex.: http://localhost:3000/api/v1). Vazio = mesma origem. */
    baseUrl: string;
    /** Padrão: 10 000 ms. */
    timeoutMs?: number;
    fetch?: typeof fetch;
    generateRequestId?: () => string;
    /** Devolve o token de acesso atual, se houver. Nunca é logado nem incluído em erros. */
    getAccessToken?: () => string | null | undefined;
};

export type ApiClient = {
    request<T>(
        method: string,
        path: string,
        options?: RequestOptions,
    ): Promise<T>;
    get<T>(path: string, options?: Omit<RequestOptions, "body">): Promise<T>;
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(
        path: string,
        body?: unknown,
        options?: RequestOptions,
    ): Promise<T>;
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
};

export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Id enviado em `x-request-id`. O backend só aceita [A-Za-z0-9._-]{1,128}; um UUID cabe.
 * `crypto.randomUUID` só existe em contexto seguro (https ou localhost), então há reserva
 * para quem abre o app por http em outro host da rede local.
 */
export function generateRequestId(): string {
    const c = globalThis.crypto;
    if (typeof c?.randomUUID === "function") return c.randomUUID();

    const bytes = new Uint8Array(16);
    if (typeof c?.getRandomValues === "function") {
        c.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
        "",
    );
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function buildUrl(
    baseUrl: string,
    path: string,
    query?: Record<string, QueryValue>,
): string {
    // Caminho absoluto mandaria o token de acesso para outra origem.
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) {
        throw new ApiConfigError(
            "Use um caminho relativo à API (ex.: /auth/login), não uma URL.",
        );
    }
    const normalized = path.startsWith("/") ? path : `/${path}`;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    }
    const qs = params.toString();
    return `${baseUrl}${normalized}${qs ? `?${qs}` : ""}`;
}

function parseRetryAfter(value: string | null): number | undefined {
    if (!value) return undefined;
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/** Interpreta o corpo de erro padrão do Nest: { statusCode, message, error }. */
function parseErrorBody(text: string): {
    message?: string;
    code?: string;
    details: string[];
} {
    try {
        const data: unknown = JSON.parse(text);
        if (data && typeof data === "object") {
            const { message, error } = data as Record<string, unknown>;
            const code = typeof error === "string" ? error : undefined;
            if (typeof message === "string") {
                return { message, code, details: [] };
            }
            if (Array.isArray(message)) {
                const details = message.filter(
                    (item): item is string => typeof item === "string",
                );
                return { message: details.join("; "), code, details };
            }
            return { code, details: [] };
        }
    } catch {
        // corpo não é JSON
    }
    return { details: [] };
}

export function createApiClient(options: ApiClientOptions): ApiClient {
    const baseUrl = options.baseUrl.replace(/\/+$/, "");
    const defaultTimeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const newRequestId = options.generateRequestId ?? generateRequestId;

    async function request<T>(
        method: string,
        path: string,
        opts: RequestOptions = {},
    ): Promise<T> {
        const url = buildUrl(baseUrl, path, opts.query);
        const requestId = newRequestId();
        const timeoutMs = opts.timeoutMs ?? defaultTimeout;

        const headers: Record<string, string> = {
            ...opts.headers,
            Accept: "application/json",
            "x-request-id": requestId,
        };
        if (opts.body !== undefined)
            headers["Content-Type"] = "application/json";
        if (opts.auth !== false) {
            const token = options.getAccessToken?.();
            if (token) headers.Authorization = `Bearer ${token}`;
        }

        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeoutMs);
        const onCallerAbort = () => controller.abort();
        if (opts.signal?.aborted) controller.abort();
        opts.signal?.addEventListener("abort", onCallerAbort, { once: true });

        // Traduz qualquer falha de transporte (inclusive durante a leitura do corpo).
        const fail = (error: unknown): never => {
            if (timedOut) throw new ApiTimeoutError(timeoutMs, requestId);
            if (controller.signal.aborted) throw new ApiAbortError(requestId);
            if (error instanceof ApiError) throw error;
            throw new ApiNetworkError(requestId);
        };

        try {
            let response: Response;
            try {
                response = await (options.fetch ?? fetch)(url, {
                    method,
                    headers,
                    body:
                        opts.body === undefined
                            ? undefined
                            : JSON.stringify(opts.body),
                    // Autenticação é por Bearer; nunca envia cookies.
                    credentials: "omit",
                    signal: controller.signal,
                });
            } catch (error) {
                return fail(error);
            }

            let text: string;
            try {
                text = await response.text();
            } catch (error) {
                return fail(error);
            }
            const effectiveId =
                response.headers.get("x-request-id") ?? requestId;

            if (!response.ok) {
                const parsed = parseErrorBody(text);
                throw new ApiHttpError({
                    status: response.status,
                    message: parsed.message ?? `Erro ${response.status}`,
                    code: parsed.code,
                    details: parsed.details,
                    retryAfterSeconds: parseRetryAfter(
                        response.headers.get("retry-after"),
                    ),
                    requestId: effectiveId,
                });
            }

            if (response.status === 204 || text.trim() === "") {
                return undefined as T;
            }
            try {
                return JSON.parse(text) as T;
            } catch {
                const isHtml = (response.headers.get("content-type") ?? "")
                    .toLowerCase()
                    .includes("text/html");
                throw new ApiError(
                    isHtml
                        ? "A resposta é uma página HTML, não JSON. Confira a URL da API (VITE_API_URL)."
                        : "Resposta inválida do servidor (não é JSON).",
                    effectiveId,
                );
            }
        } finally {
            clearTimeout(timer);
            opts.signal?.removeEventListener("abort", onCallerAbort);
        }
    }

    return {
        request,
        get: (path, o) => request("GET", path, o),
        post: (path, body, o) => request("POST", path, { ...o, body }),
        put: (path, body, o) => request("PUT", path, { ...o, body }),
        patch: (path, body, o) => request("PATCH", path, { ...o, body }),
        delete: (path, o) => request("DELETE", path, o),
    };
}

let defaultClient: ApiClient | undefined;

/** Cliente configurado com VITE_API_URL. Criado no primeiro uso. */
export function getApiClient(): ApiClient {
    defaultClient ??= createApiClient({ baseUrl: loadEnv().apiUrl });
    return defaultClient;
}
