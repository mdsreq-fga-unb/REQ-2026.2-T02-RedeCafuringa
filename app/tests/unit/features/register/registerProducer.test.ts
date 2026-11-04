import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterPayload } from "@/features/register/registerForm";

const API = "http://api.test/api/v1";

const payload: RegisterPayload = {
    name: "Maria da Silva",
    document: "52998224725",
    phone: "61912345678",
    email: "maria@exemplo.com",
    address: "Chácara 12, Núcleo Rural, Brasília - DF",
    password: "senha-segura-1",
    isAdult: true,
};

function jsonResponse(
    body: unknown,
    status = 200,
    headers: Record<string, string> = {},
) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
    });
}

// Mesmo padrão do authService.test: o cliente HTTP padrão nasce no primeiro uso,
// a partir de VITE_API_URL, então recarregamos os módulos a cada teste.
async function load() {
    vi.resetModules();
    return import("@/features/register/registerService");
}

beforeEach(() => {
    vi.stubEnv("VITE_API_URL", API);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("registerProducer (API real)", () => {
    it("envia o corpo traduzido a POST /users/producers e devolve ok em 201", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(
                jsonResponse({ id: "abc", perfil: "PRODUTOR" }, 201),
            );
        vi.stubGlobal("fetch", fetchMock);
        const { registerProducer } = await load();

        const result = await registerProducer(payload);

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toBe(`${API}/users/producers`);
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({
            nome: "Maria da Silva",
            cpf: "52998224725",
            telefone: "61912345678",
            email: "maria@exemplo.com",
            endereco: "Chácara 12, Núcleo Rural, Brasília - DF",
            senha: "senha-segura-1",
            maiorDeIdade: true,
        });
        expect(
            (init?.headers as Record<string, string>).Authorization,
        ).toBeUndefined();
        expect(result).toEqual({ ok: true });
    });

    it("devolve duplicate quando o servidor responde 409", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                jsonResponse(
                    {
                        statusCode: 409,
                        message: "CPF já cadastrado",
                        error: "Conflict",
                    },
                    409,
                ),
            ),
        );
        const { registerProducer } = await load();

        expect(await registerProducer(payload)).toEqual({
            ok: false,
            reason: "duplicate",
        });
    });

    it("devolve invalid com as mensagens do servidor quando responde 400", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                jsonResponse(
                    {
                        statusCode: 400,
                        message: ["CPF inválido", "Senha é obrigatória"],
                        error: "Bad Request",
                    },
                    400,
                ),
            ),
        );
        const { registerProducer } = await load();

        expect(await registerProducer(payload)).toEqual({
            ok: false,
            reason: "invalid",
            messages: ["CPF inválido", "Senha é obrigatória"],
        });
    });

    it("devolve rate_limit com o tempo de espera quando responde 429", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                jsonResponse(
                    {
                        statusCode: 429,
                        message: "Too Many Requests",
                        error: "Too Many Requests",
                    },
                    429,
                    { "retry-after": "30" },
                ),
            ),
        );
        const { registerProducer } = await load();

        expect(await registerProducer(payload)).toEqual({
            ok: false,
            reason: "rate_limit",
            retryAfterSeconds: 30,
        });
    });

    it.each([500, 503])(
        "devolve error genérico quando o servidor responde %i",
        async (status) => {
            vi.stubGlobal(
                "fetch",
                vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(
                        jsonResponse(
                            { statusCode: status, message: "x", error: "x" },
                            status,
                        ),
                    ),
            );
            const { registerProducer } = await load();

            expect(await registerProducer(payload)).toEqual({
                ok: false,
                reason: "error",
            });
        },
    );

    it("devolve error genérico quando não há conexão com o servidor", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn<typeof fetch>()
                .mockRejectedValue(new TypeError("Failed to fetch")),
        );
        const { registerProducer } = await load();

        expect(await registerProducer(payload)).toEqual({
            ok: false,
            reason: "error",
        });
    });
});

describe("registerProducer (modo mock)", () => {
    it("não chama a rede e detecta duplicidade em memória", async () => {
        vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        const { registerProducer } = await load();
        const mockPayload = { ...payload, document: "39053344705" };

        expect(await registerProducer(mockPayload)).toEqual({ ok: true });
        expect(await registerProducer(mockPayload)).toEqual({
            ok: false,
            reason: "duplicate",
            field: "document",
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
