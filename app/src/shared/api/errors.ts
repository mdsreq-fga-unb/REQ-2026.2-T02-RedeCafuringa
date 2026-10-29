/** Base de todos os erros do cliente HTTP. Nunca carrega corpo de requisição nem token. */
export class ApiError extends Error {
    readonly requestId?: string;

    constructor(message: string, requestId?: string) {
        super(message);
        this.name = "ApiError";
        this.requestId = requestId;
    }
}

/** O servidor respondeu com status fora de 2xx. */
export class ApiHttpError extends ApiError {
    readonly status: number;
    /** Rótulo do erro devolvido pelo servidor (ex.: "Unauthorized"). */
    readonly code?: string;
    /** Mensagens individuais, quando o servidor devolve uma lista (validação). */
    readonly details: string[];
    /** Segundos até poder tentar de novo (cabeçalho Retry-After, em 429). */
    readonly retryAfterSeconds?: number;

    constructor(init: {
        status: number;
        message: string;
        code?: string;
        details?: string[];
        retryAfterSeconds?: number;
        requestId?: string;
    }) {
        super(init.message, init.requestId);
        this.name = "ApiHttpError";
        this.status = init.status;
        this.code = init.code;
        this.details = init.details ?? [];
        this.retryAfterSeconds = init.retryAfterSeconds;
    }
}

/** Sem resposta: offline, DNS, CORS ou servidor fora do ar. */
export class ApiNetworkError extends ApiError {
    constructor(requestId?: string) {
        super("Não foi possível conectar ao servidor.", requestId);
        this.name = "ApiNetworkError";
    }
}

/** A requisição passou do tempo limite. */
export class ApiTimeoutError extends ApiError {
    readonly timeoutMs: number;

    constructor(timeoutMs: number, requestId?: string) {
        super("O servidor demorou demais para responder.", requestId);
        this.name = "ApiTimeoutError";
        this.timeoutMs = timeoutMs;
    }
}

/** Quem chamou cancelou a requisição (AbortSignal). */
export class ApiAbortError extends ApiError {
    constructor(requestId?: string) {
        super("Requisição cancelada.", requestId);
        this.name = "ApiAbortError";
    }
}

/** Uso inválido do cliente (ex.: caminho absoluto, que vazaria o token para outra origem). */
export class ApiConfigError extends ApiError {
    constructor(message: string) {
        super(message);
        this.name = "ApiConfigError";
    }
}
