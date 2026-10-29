import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { components } from "@/shared/api/schema";

type LoginResponse = components["schemas"]["LoginResponse"];

const API = "http://api.test/api/v1";

function backendLogin(
    perfil: LoginResponse["usuario"]["perfil"],
): LoginResponse {
    return {
        accessToken: "jwt-abc",
        tokenType: "Bearer",
        expiresIn: 900,
        usuario: {
            id: "665f1c2e9b1e8a0012345678",
            nome: "Dona Maria",
            email: "maria@exemplo.com",
            telefone: "61999990000",
            perfil,
            cpf: "***.982.247-**",
        },
    };
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

// O cliente HTTP padrão é criado no primeiro uso, a partir de VITE_API_URL: recarrega
// os módulos a cada teste para cada um começar do zero.
async function load() {
    vi.resetModules();
    return {
        ...(await import("@/features/auth/authService")),
        ...(await import("@/features/auth/errors")),
    };
}

beforeEach(() => {
    vi.stubEnv("VITE_API_URL", API);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("authService.login", () => {
    it("envia CPF e senha ao contrato real (POST /auth/login com `senha`) e converte a resposta", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(jsonResponse(backendLogin("PRODUTOR")));
        vi.stubGlobal("fetch", fetchMock);
        const { login } = await load();

        const result = await login({
            cpf: "52998224725",
            password: "senha123",
        });

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toBe(`${API}/auth/login`);
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({
            cpf: "52998224725",
            senha: "senha123",
        });
        expect(
            (init?.headers as Record<string, string>).Authorization,
        ).toBeUndefined();
        expect(result).toEqual({
            token: "jwt-abc",
            user: {
                id: "665f1c2e9b1e8a0012345678",
                name: "Dona Maria",
                role: "producer",
            },
        });
    });

    it("mapeia CONSUMIDOR para consumer e PRODUTOR para producer", async () => {
        const { toAuthResult } = await load();

        expect(toAuthResult(backendLogin("CONSUMIDOR")).user.role).toBe(
            "consumer",
        );
        expect(toAuthResult(backendLogin("PRODUTOR")).user.role).toBe(
            "producer",
        );
    });

    it("recusa o perfil ADMINISTRADOR, que ainda não tem área no app", async () => {
        const { toAuthResult } = await load();

        expect(() => toAuthResult(backendLogin("ADMINISTRADOR"))).toThrow(
            /não é suportado/,
        );
    });

    it("lança InvalidCredentialsError quando o servidor responde 401", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                jsonResponse(
                    {
                        statusCode: 401,
                        message: "Unauthorized",
                        error: "Unauthorized",
                    },
                    401,
                ),
            ),
        );
        const { login, InvalidCredentialsError } = await load();

        await expect(
            login({ cpf: "52998224725", password: "errada" }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it.each([403, 429, 500])(
        "lança um erro diferente de credenciais quando o servidor responde %i",
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
            const { login, InvalidCredentialsError } = await load();

            const error = await login({
                cpf: "52998224725",
                password: "senha123",
            }).catch((caught: unknown) => caught);

            expect(error).toBeInstanceOf(Error);
            expect(error).not.toBeInstanceOf(InvalidCredentialsError);
        },
    );

    it("lança erro genérico quando não há conexão com o servidor", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn<typeof fetch>()
                .mockRejectedValue(new TypeError("Failed to fetch")),
        );
        const { login, InvalidCredentialsError } = await load();

        const error = await login({
            cpf: "52998224725",
            password: "senha123",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(InvalidCredentialsError);
    });
});
