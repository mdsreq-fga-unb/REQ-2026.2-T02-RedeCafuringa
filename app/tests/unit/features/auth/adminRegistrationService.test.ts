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

    it("no modo mock, não persiste a senha e rejeita e-mail duplicado", async () => {
        vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
        const { registerAdmin } = await load();

        await registerAdmin(admin);

        expect(
            JSON.parse(
                localStorage.getItem("cafuringa-mock-admin-emails") || "[]",
            ),
        ).toEqual(["admin@exemplo.com"]);
        expect(
            localStorage.getItem("cafuringa-mock-admin-emails"),
        ).not.toContain(admin.senha);
        await expect(registerAdmin(admin)).rejects.toThrow(
            "E-mail já cadastrado",
        );
    });
});
