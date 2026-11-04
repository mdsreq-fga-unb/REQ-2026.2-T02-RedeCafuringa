import { afterEach, describe, expect, it, vi } from "vitest";
import type { RegisterPayload } from "@/features/register/registerForm";

const payload: RegisterPayload = {
    name: "Seu João",
    document: "39053344705",
    phone: "61912345678",
    email: "joao@exemplo.com",
    address: "Chácara 7, Núcleo Rural, Brasília - DF",
    password: "senha-segura-1",
};

// O módulo lê VITE_USE_MOCK_AUTH ao ser importado, e o cadastro e o login mock
// guardam contas em memória: cada teste importa tudo de novo, do zero.
async function loadMock() {
    vi.resetModules();
    vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
    const { registerProducer } =
        await import("@/features/register/registerService");
    const { loginMock } = await import("@/features/auth/mockAuth");
    const { InvalidCredentialsError } = await import("@/features/auth/errors");
    return { registerProducer, loginMock, InvalidCredentialsError };
}

describe("cadastro mock ligado ao login mock (HU02, critérios 7 e 9)", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    // Critério 9
    it("deixa a conta cadastrada entrar no login como produtor", async () => {
        const { registerProducer, loginMock } = await loadMock();

        const result = await registerProducer(payload);
        const auth = await loginMock({
            cpf: payload.document,
            password: payload.password,
        });

        expect(result).toEqual({ ok: true });
        expect(auth.user.name).toBe("Seu João");
        expect(auth.user.role).toBe("producer");
    });

    // Critério 7
    it.each(["52998224725", "11144477735"])(
        "trata o CPF de demonstração %s como já cadastrado",
        async (document) => {
            const { registerProducer } = await loadMock();

            const result = await registerProducer({ ...payload, document });

            expect(result).toEqual({
                ok: false,
                reason: "duplicate",
                field: "document",
            });
        },
    );

    it("não cria acesso de login quando o cadastro é recusado por e-mail repetido", async () => {
        const { registerProducer, loginMock, InvalidCredentialsError } =
            await loadMock();
        await registerProducer(payload);

        const result = await registerProducer({
            ...payload,
            document: "86288366757",
        });

        expect(result).toEqual({
            ok: false,
            reason: "duplicate",
            field: "email",
        });
        await expect(
            loginMock({ cpf: "86288366757", password: payload.password }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
});
