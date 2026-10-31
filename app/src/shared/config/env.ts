export type AppEnv = {
    /** URL base da API, sem barra final (ex.: http://localhost:3000/api/v1). Vazio = mesma origem. */
    apiUrl: string;
    /** Login falso, só para desenvolvimento. */
    useMockAuth: boolean;
};

export type RawEnv = {
    VITE_API_URL?: string;
    VITE_USE_MOCK_AUTH?: string;
    /** import.meta.env.PROD */
    PROD?: boolean;
};

export type ParsedEnv = {
    env: AppEnv;
    /** Avisos que não impedem o app de iniciar. */
    warnings: string[];
};

export class EnvError extends Error {
    readonly problems: string[];

    constructor(problems: string[]) {
        super(`Configuração inválida: ${problems.join("; ")}`);
        this.name = "EnvError";
        this.problems = problems;
    }
}

function parseApiUrl(value: string | undefined, problems: string[]): string {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return "";

    try {
        const url = new URL(trimmed);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return trimmed.replace(/\/+$/, "");
        }
    } catch {
        // cai no erro abaixo
    }
    problems.push(
        `VITE_API_URL deve ser uma URL http(s) válida (recebido: "${trimmed}")`,
    );
    return "";
}

/**
 * Valida as variáveis de ambiente do build. Valor inválido é erro; variável ausente
 * não é: a URL da API é opcional (a imagem pode ser publicada antes do deploy da API)
 * e o cliente HTTP reclama no primeiro uso.
 */
export function parseEnv(raw: RawEnv): ParsedEnv {
    const problems: string[] = [];
    const warnings: string[] = [];

    const apiUrl = parseApiUrl(raw.VITE_API_URL, problems);

    const flag = (raw.VITE_USE_MOCK_AUTH ?? "").trim();
    if (flag !== "" && flag !== "true" && flag !== "false") {
        problems.push(
            `VITE_USE_MOCK_AUTH deve ser "true" ou "false" (recebido: "${flag}")`,
        );
    }
    const useMockAuth = flag === "true";

    if (raw.PROD && useMockAuth) {
        warnings.push(
            "VITE_USE_MOCK_AUTH=true em build de produção: o login é falso. Use apenas em demonstrações.",
        );
    }

    if (problems.length > 0) throw new EnvError(problems);
    return { env: { apiUrl, useMockAuth }, warnings };
}

/** Lê e valida import.meta.env. Chame uma vez, na inicialização do app. */
export function loadEnv(): AppEnv {
    const { env, warnings } = parseEnv({
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_USE_MOCK_AUTH: import.meta.env.VITE_USE_MOCK_AUTH,
        PROD: import.meta.env.PROD,
    });
    for (const warning of warnings) console.warn(warning);
    return env;
}
