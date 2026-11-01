import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConsumerSignupData } from "@/features/auth/registrationService";

const API = "http://api.test/api/v1";
const consumer: ConsumerSignupData = {
    nome: " Gabriela Pereira da Silva ",
    cpf: "529.982.247-25",
    email: " Gabriela@Exemplo.com ",
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
            cpf: "52998224725",
            email: "gabriela@exemplo.com",
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
});
