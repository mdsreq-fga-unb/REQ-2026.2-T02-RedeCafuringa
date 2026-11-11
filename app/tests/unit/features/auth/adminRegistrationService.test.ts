import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const API = "http://api.test/api/v1";
const admin = {
    email: " Admin@Exemplo.com ",
    senha: "SenhaForte123",
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

async function load() {
    vi.resetModules();
    return import("@/features/auth/registrationService");
}

beforeEach(() => {
    vi.stubEnv("VITE_API_URL", API);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    localStorage.clear();
});

describe("registrationService.registerAdmin", () => {
    it("envia e-mail normalizado com a sessão autorizada", async () => {
        localStorage.setItem("cafuringa-token", "session-token");
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(jsonResponse({ id: "admin-1" }, 201));
        vi.stubGlobal("fetch", fetchMock);
        const { registerAdmin } = await load();

        await registerAdmin(admin);

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toBe(`${API}/users/admins`);
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({
            email: "admin@exemplo.com",
            senha: "SenhaForte123",
        });
        expect((init?.headers as Record<string, string>).Authorization).toBe(
            "Bearer session-token",
        );
    });

    it("exige sessão antes de tentar criar uma conta administrativa", async () => {
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        const { registerAdmin } = await load();

        await expect(registerAdmin(admin)).rejects.toThrow(
            "Entre com uma conta autorizada",
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("converte conflito de e-mail duplicado em mensagem amigável", async () => {
        localStorage.setItem("cafuringa-token", "session-token");
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                jsonResponse(
                    {
                        statusCode: 409,
                        message: "E-mail já cadastrado",
                        error: "Conflict",
                    },
                    409,
                ),
            ),
        );
        const { registerAdmin } = await load();

        await expect(registerAdmin(admin)).rejects.toMatchObject({
            message: "E-mail já cadastrado",
        });
    });

    it("no modo mock, rejeita e-mail duplicado e a conta criada consegue entrar", async () => {
        vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
        const { registerAdmin } = await load();
        const novo = {
            email: "Novo.Admin@Exemplo.com",
            senha: "SenhaForte123",
        };
        const { loginMock } = await import("@/features/auth/mockAuth");

        await registerAdmin(novo);

        await expect(registerAdmin(novo)).rejects.toThrow(
            "E-mail já cadastrado",
        );
        const auth = await loginMock({
            email: "novo.admin@exemplo.com",
            password: novo.senha,
        });
        expect(auth.user.role).toBe("admin");
        // O e-mail do administrador padrão da demonstração também é reservado.
        await expect(
            registerAdmin({
                email: "admin@exemplo.com",
                senha: "SenhaForte123",
            }),
        ).rejects.toThrow("E-mail já cadastrado");
    });

    it("trata 400 do back com a mensagem de validação", async () => {
        localStorage.setItem("cafuringa-token", "session-token");
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                jsonResponse(
                    {
                        statusCode: 400,
                        message: ["Senha deve conter pelo menos um número"],
                        error: "Bad Request",
                    },
                    400,
                ),
            ),
        );
        const { registerAdmin } = await load();

        await expect(registerAdmin(admin)).rejects.toThrow(
            "Senha deve conter pelo menos um número",
        );
    });

    it.each([401, 403])(
        "converte %i em orientação para entrar com conta autorizada",
        async (status) => {
            localStorage.setItem("cafuringa-token", "session-token");
            vi.stubGlobal(
                "fetch",
                vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(
                        jsonResponse(
                            { statusCode: status, message: "x" },
                            status,
                        ),
                    ),
            );
            const { registerAdmin } = await load();

            await expect(registerAdmin(admin)).rejects.toThrow(
                "Entre com uma conta autorizada",
            );
        },
    );

    it("falha de rede vira mensagem de conexão", async () => {
        localStorage.setItem("cafuringa-token", "session-token");
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline")),
        );
        const { registerAdmin } = await load();

        await expect(registerAdmin(admin)).rejects.toThrow("Falha na conexão");
    });
});
