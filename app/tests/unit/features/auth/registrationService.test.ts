import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConsumerSignupData } from "@/features/auth/registrationService";

const API = "http://api.test/api/v1";
const consumer: ConsumerSignupData = {
    nome: " Gabriela Pereira da Silva ",
    cpf: "168.995.350-09",
    email: " Gabriela@Exemplo.com ",
    dataNascimento: "10-05-1990",
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

describe("registrationService.registerConsumer", () => {
    it("envia os campos do protótipo normalizados para cadastro público", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(jsonResponse({ id: "consumer-1" }, 201));
        vi.stubGlobal("fetch", fetchMock);
        const { registerConsumer } = await load();

        await registerConsumer(consumer);

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toBe(`${API}/users/consumers`);
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({
            nome: "Gabriela Pereira da Silva",
            cpf: "16899535009",
            email: "gabriela@exemplo.com",
            dataNascimento: "1990-05-10",
            senha: "SenhaForte123",
        });
        expect(
            (init?.headers as Record<string, string>).Authorization,
        ).toBeUndefined();
    });

    it.each([
        ["E-mail já cadastrado", "E-mail já cadastrado"],
        ["CPF já cadastrado", "CPF já cadastrado"],
    ])(
        "CA03/CA04: informa o conflito devolvido pela API (%s)",
        async (message, expectedMessage) => {
            vi.stubGlobal(
                "fetch",
                vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(
                        jsonResponse(
                            { statusCode: 409, message, error: "Conflict" },
                            409,
                        ),
                    ),
            );
            const { registerConsumer } = await load();

            await expect(registerConsumer(consumer)).rejects.toMatchObject({
                message: expectedMessage,
            });
        },
    );

    it("persiste cadastro mockado e permite entrar com a conta criada", async () => {
        vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        const { registerConsumer } = await load();

        await registerConsumer(consumer);

        const savedUsers = JSON.parse(
            localStorage.getItem("cafuringa-mock-users") || "[]",
        );
        expect(savedUsers).toHaveLength(1);
        expect(savedUsers[0]).toMatchObject({
            cpf: "16899535009",
            email: "gabriela@exemplo.com",
            user: {
                name: "Gabriela Pereira da Silva",
                role: "consumer",
            },
        });
        expect(fetchMock).not.toHaveBeenCalled();

        const { login } = await import("@/features/auth/authService");
        await expect(
            login({ email: "gabriela@exemplo.com", password: "SenhaForte123" }),
        ).resolves.toMatchObject({
            user: {
                name: "Gabriela Pereira da Silva",
                role: "consumer",
            },
        });
    });

    it.each([
        { data: consumer, message: "CPF" },
        {
            data: {
                ...consumer,
                cpf: "123.456.789-09",
                email: "GABRIELA@EXEMPLO.COM",
            },
            message: "E-mail",
        },
    ])(
        "rejeita $message duplicado no cadastro mockado",
        async ({ data, message }) => {
            vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
            const { registerConsumer } = await load();
            await registerConsumer(consumer);

            await expect(registerConsumer(data)).rejects.toThrow(
                `${message} já cadastrado`,
            );
        },
    );
});
