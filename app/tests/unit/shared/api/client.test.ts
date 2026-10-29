import { afterEach, describe, expect, it, vi } from "vitest";
import {
    ApiAbortError,
    ApiConfigError,
    ApiError,
    ApiHttpError,
    ApiNetworkError,
    ApiTimeoutError,
    createApiClient,
    generateRequestId,
    type ApiClientOptions,
} from "@/shared/api";

const BASE = "http://api.test/api/v1";
// Formato que o backend aceita em x-request-id.
const REQUEST_ID_FORMAT = /^[A-Za-z0-9._-]{1,128}$/;

function jsonResponse(body: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
        ...init,
    });
}

function setup(handler: typeof fetch, extra: Partial<ApiClientOptions> = {}) {
    const fetchMock = vi.fn<typeof fetch>(handler);
    const client = createApiClient({
        baseUrl: BASE,
        fetch: fetchMock,
        generateRequestId: () => "req-123",
        ...extra,
    });
    return { fetchMock, client };
}

function lastCall(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) {
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    return {
        url: String(url),
        init: init!,
        headers: init!.headers as Record<string, string>,
    };
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("createApiClient: requisição", () => {
    it("monta a URL com caminho e query, ignorando valores vazios", async () => {
        const { client, fetchMock } = setup(async () => jsonResponse({}));

        await client.get("/ofertas", {
            query: {
                q: "café com leite",
                page: 2,
                ativo: true,
                vazio: undefined,
                nulo: null,
            },
        });

        expect(lastCall(fetchMock).url).toBe(
            `${BASE}/ofertas?q=caf%C3%A9+com+leite&page=2&ativo=true`,
        );
    });

    it("aceita caminho sem barra inicial e base com barra final", async () => {
        const { fetchMock } = setup(async () => jsonResponse({}));
        const client = createApiClient({
            baseUrl: `${BASE}/`,
            fetch: fetchMock,
        });

        await client.get("ofertas");

        expect(lastCall(fetchMock).url).toBe(`${BASE}/ofertas`);
    });

    it("envia Accept, x-request-id e nunca cookies", async () => {
        const { client, fetchMock } = setup(async () => jsonResponse({}));

        await client.get("/x");

        const { headers, init } = lastCall(fetchMock);
        expect(headers.Accept).toBe("application/json");
        expect(headers["x-request-id"]).toBe("req-123");
        expect(headers["Content-Type"]).toBeUndefined();
        expect(headers.Authorization).toBeUndefined();
        expect(init.credentials).toBe("omit");
    });

    it("serializa o corpo como JSON e define Content-Type", async () => {
        const { client, fetchMock } = setup(async () => jsonResponse({}));

        await client.post("/auth/login", { cpf: "1", senha: "2" });

        const { headers, init } = lastCall(fetchMock);
        expect(init.method).toBe("POST");
        expect(init.body).toBe('{"cpf":"1","senha":"2"}');
        expect(headers["Content-Type"]).toBe("application/json");
    });

    it("envia Authorization só quando há token e a chamada não pede auth:false", async () => {
        const { client, fetchMock } = setup(async () => jsonResponse({}), {
            getAccessToken: () => "tok-abc",
        });

        await client.get("/me");
        expect(lastCall(fetchMock).headers.Authorization).toBe(
            "Bearer tok-abc",
        );

        await client.post("/auth/login", {}, { auth: false });
        expect(lastCall(fetchMock).headers.Authorization).toBeUndefined();
    });

    it("não deixa o chamador sobrescrever o x-request-id", async () => {
        const { client, fetchMock } = setup(async () => jsonResponse({}));

        await client.get("/x", { headers: { "x-request-id": "forjado" } });

        expect(lastCall(fetchMock).headers["x-request-id"]).toBe("req-123");
    });

    it("recusa URL absoluta, que levaria o token para outra origem", async () => {
        const { client, fetchMock } = setup(async () => jsonResponse({}), {
            getAccessToken: () => "tok-abc",
        });

        for (const path of [
            "https://evil.test/x",
            "//evil.test/x",
            "javascript:alert(1)",
        ]) {
            await expect(client.get(path), path).rejects.toBeInstanceOf(
                ApiConfigError,
            );
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("createApiClient: resposta", () => {
    it("devolve o JSON da resposta", async () => {
        const { client } = setup(async () => jsonResponse({ ok: true }));
        await expect(client.get("/x")).resolves.toEqual({ ok: true });
    });

    it("devolve undefined em 204 e em corpo vazio", async () => {
        const { client } = setup(
            async () => new Response(null, { status: 204 }),
        );
        await expect(client.delete("/x")).resolves.toBeUndefined();

        const empty = setup(async () => new Response("", { status: 200 }));
        await expect(empty.client.get("/x")).resolves.toBeUndefined();
    });

    it("normaliza erro do Nest com mensagem simples (401)", async () => {
        const { client } = setup(async () =>
            jsonResponse(
                {
                    statusCode: 401,
                    message: "Unauthorized",
                    error: "Unauthorized",
                },
                { status: 401 },
            ),
        );

        const error = await client.get("/me").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiHttpError);
        expect(error).toMatchObject({
            status: 401,
            message: "Unauthorized",
            code: "Unauthorized",
            details: [],
            requestId: "req-123",
        });
    });

    it("normaliza erro de validação, em que a mensagem é uma lista (400)", async () => {
        const { client } = setup(async () =>
            jsonResponse(
                {
                    statusCode: 400,
                    message: ["cpf inválido", "senha é obrigatória"],
                    error: "Bad Request",
                },
                { status: 400 },
            ),
        );

        const error = (await client
            .post("/auth/login", {})
            .catch((e: unknown) => e)) as ApiHttpError;

        expect(error.status).toBe(400);
        expect(error.details).toEqual(["cpf inválido", "senha é obrigatória"]);
        expect(error.message).toBe("cpf inválido; senha é obrigatória");
    });

    it("expõe Retry-After no 429 e prefere o request id devolvido pelo servidor", async () => {
        const { client } = setup(async () =>
            jsonResponse(
                { statusCode: 429, message: "Too Many Requests" },
                {
                    status: 429,
                    headers: {
                        "content-type": "application/json",
                        "retry-after": "30",
                        "x-request-id": "srv-9",
                    },
                },
            ),
        );

        const error = (await client
            .get("/x")
            .catch((e: unknown) => e)) as ApiHttpError;

        expect(error.retryAfterSeconds).toBe(30);
        expect(error.requestId).toBe("srv-9");
    });

    it("dá mensagem genérica quando o corpo do erro não é JSON", async () => {
        const { client } = setup(
            async () => new Response("Bad Gateway", { status: 502 }),
        );

        const error = (await client
            .get("/x")
            .catch((e: unknown) => e)) as ApiHttpError;

        expect(error).toBeInstanceOf(ApiHttpError);
        expect(error.message).toBe("Erro 502");
        expect(error.details).toEqual([]);
    });

    it("explica quando a API devolve HTML com sucesso (URL da API errada)", async () => {
        const { client } = setup(
            async () =>
                new Response("<!doctype html><html></html>", {
                    status: 200,
                    headers: { "content-type": "text/html" },
                }),
        );

        const error = await client.get("/x").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).not.toBeInstanceOf(ApiHttpError);
        expect((error as ApiError).message).toContain("VITE_API_URL");
    });

    it("rejeita sucesso com corpo que não é JSON", async () => {
        const { client } = setup(
            async () => new Response("texto solto", { status: 200 }),
        );
        await expect(client.get("/x")).rejects.toThrow("não é JSON");
    });
});

describe("createApiClient: falhas de transporte", () => {
    it("converte falha de rede em ApiNetworkError com o request id", async () => {
        const { client } = setup(async () => {
            throw new TypeError("Failed to fetch");
        });

        const error = await client.get("/x").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiNetworkError);
        expect((error as ApiNetworkError).requestId).toBe("req-123");
    });

    it("estoura o tempo limite com ApiTimeoutError", async () => {
        vi.useFakeTimers();
        const { client } = setup(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init!.signal!.addEventListener("abort", () =>
                        reject(new DOMException("aborted", "AbortError")),
                    );
                }),
            { timeoutMs: 5_000 },
        );

        const outcome = client.get("/lento").catch((e: unknown) => e);
        await vi.advanceTimersByTimeAsync(5_000);

        const error = (await outcome) as ApiTimeoutError;
        expect(error).toBeInstanceOf(ApiTimeoutError);
        expect(error.timeoutMs).toBe(5_000);
    });

    it("também aplica o tempo limite enquanto lê o corpo da resposta", async () => {
        vi.useFakeTimers();
        const { client } = setup(
            async (_url, init) =>
                ({
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    text: () =>
                        new Promise<string>((_resolve, reject) => {
                            init!.signal!.addEventListener("abort", () =>
                                reject(
                                    new DOMException("aborted", "AbortError"),
                                ),
                            );
                        }),
                }) as unknown as Response,
            { timeoutMs: 1_000 },
        );

        const outcome = client.get("/corpo-lento").catch((e: unknown) => e);
        await vi.advanceTimersByTimeAsync(1_000);

        expect(await outcome).toBeInstanceOf(ApiTimeoutError);
    });

    it("converte cancelamento do chamador em ApiAbortError", async () => {
        const { client } = setup(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init!.signal!.addEventListener("abort", () =>
                        reject(new DOMException("aborted", "AbortError")),
                    );
                }),
        );
        const controller = new AbortController();

        const outcome = client
            .get("/x", { signal: controller.signal })
            .catch((e: unknown) => e);
        controller.abort();

        expect(await outcome).toBeInstanceOf(ApiAbortError);
    });

    it("trata signal já cancelado como ApiAbortError", async () => {
        const { client } = setup(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    if (init!.signal!.aborted) {
                        reject(new DOMException("aborted", "AbortError"));
                    }
                }),
        );

        await expect(
            client.get("/x", { signal: AbortSignal.abort() }),
        ).rejects.toBeInstanceOf(ApiAbortError);
    });
});

describe("generateRequestId", () => {
    const UUID_V4 =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    it("gera ids aceitos pelo backend e diferentes entre si", () => {
        const a = generateRequestId();
        const b = generateRequestId();
        expect(a).toMatch(REQUEST_ID_FORMAT);
        expect(a).not.toBe(b);
    });

    it("tem reserva quando crypto.randomUUID não existe (http fora do localhost)", () => {
        vi.stubGlobal("crypto", {
            getRandomValues: globalThis.crypto.getRandomValues.bind(
                globalThis.crypto,
            ),
        });
        expect(generateRequestId()).toMatch(UUID_V4);
    });

    it("tem reserva quando não há crypto algum", () => {
        vi.stubGlobal("crypto", undefined);
        const id = generateRequestId();
        expect(id).toMatch(UUID_V4);
        expect(id).toMatch(REQUEST_ID_FORMAT);
    });
});

describe("getApiClient", () => {
    it("usa VITE_API_URL e reaproveita a mesma instância", async () => {
        vi.stubEnv("VITE_API_URL", "http://api.test/api/v1/");
        const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({}));
        vi.stubGlobal("fetch", fetchMock);

        const { getApiClient } = await import("@/shared/api");
        const client = getApiClient();
        await client.get("/saude");

        expect(String(fetchMock.mock.calls[0][0])).toBe(
            "http://api.test/api/v1/saude",
        );
        expect(getApiClient()).toBe(client);
    });
});
