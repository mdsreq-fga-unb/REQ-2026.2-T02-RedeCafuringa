import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidCredentialsError } from "@/features/auth/errors";
import { loginMock, registerMockConsumer } from "@/features/auth/mockAuth";
import {
    getMockRecoveryLink,
    recoveryTokensKey,
    requestMockRecovery,
    resetMockPassword,
} from "@/features/recovery/mockRecovery";

type ConsumerData = Parameters<typeof registerMockConsumer>[0];

const oneHour = 60 * 60 * 1000;

async function registerConsumer(email: string, senha: string) {
    await registerMockConsumer({
        nome: "Maria Teste",
        cpf: "390.533.447-05",
        email,
        senha,
    } as ConsumerData);
}

function tokenFrom(link: string | null): string {
    return (link ?? "").split("token=")[1] ?? "";
}

describe("mockRecovery — simulação da recuperação de acesso (HU10)", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("gera um link de redefinição para um e-mail cadastrado", async () => {
        await requestMockRecovery("ana@exemplo.com");

        expect(getMockRecoveryLink("ana@exemplo.com")).toMatch(
            /^#\/nova-senha\?token=.+$/,
        );
    });

    it("responde normalmente e não gera link quando o e-mail não tem conta", async () => {
        await expect(
            requestMockRecovery("ninguem@exemplo.com"),
        ).resolves.toBeUndefined();

        expect(getMockRecoveryLink("ninguem@exemplo.com")).toBeNull();
    });

    it("normaliza o e-mail da solicitação", async () => {
        await registerConsumer("maria@teste.com", "senhaAntiga1");

        await requestMockRecovery("  MARIA@Teste.com ");

        expect(getMockRecoveryLink("maria@teste.com")).not.toBeNull();
    });

    it("invalida o link anterior quando o e-mail é reenviado", async () => {
        await registerConsumer("maria@teste.com", "senhaAntiga1");
        await requestMockRecovery("maria@teste.com");
        const firstToken = tokenFrom(getMockRecoveryLink("maria@teste.com"));

        await requestMockRecovery("maria@teste.com");
        const secondToken = tokenFrom(getMockRecoveryLink("maria@teste.com"));

        expect(secondToken).not.toBe(firstToken);
        await expect(
            resetMockPassword({ token: firstToken, password: "novaSenha1" }),
        ).resolves.toBe(false);
    });

    it("redefine a senha com um token válido dentro do prazo", async () => {
        const start = 1_700_000_000_000;
        const now = vi.spyOn(Date, "now").mockReturnValue(start);
        await registerConsumer("maria@teste.com", "senhaAntiga1");
        await requestMockRecovery("maria@teste.com");
        const token = tokenFrom(getMockRecoveryLink("maria@teste.com"));

        now.mockReturnValue(start + 59 * 60 * 1000);
        await expect(
            resetMockPassword({ token, password: "novaSenha1" }),
        ).resolves.toBe(true);

        const auth = await loginMock({
            email: "maria@teste.com",
            password: "novaSenha1",
        });
        expect(auth.user.name).toBe("Maria Teste");
        await expect(
            loginMock({ email: "maria@teste.com", password: "senhaAntiga1" }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("não permite usar o mesmo token duas vezes", async () => {
        await registerConsumer("maria@teste.com", "senhaAntiga1");
        await requestMockRecovery("maria@teste.com");
        const token = tokenFrom(getMockRecoveryLink("maria@teste.com"));

        await resetMockPassword({ token, password: "novaSenha1" });

        await expect(
            resetMockPassword({ token, password: "outraSenha2" }),
        ).resolves.toBe(false);
        expect(getMockRecoveryLink("maria@teste.com")).toBeNull();
    });

    it("recusa um token inexistente e não altera nenhuma senha", async () => {
        await registerConsumer("maria@teste.com", "senhaAntiga1");

        await expect(
            resetMockPassword({
                token: "token-inexistente",
                password: "novaSenha1",
            }),
        ).resolves.toBe(false);

        await expect(
            loginMock({ email: "maria@teste.com", password: "senhaAntiga1" }),
        ).resolves.toBeTruthy();
    });

    it("recusa um token expirado e não altera a senha", async () => {
        const start = 1_700_000_000_000;
        const now = vi.spyOn(Date, "now").mockReturnValue(start);
        await registerConsumer("maria@teste.com", "senhaAntiga1");
        await requestMockRecovery("maria@teste.com");
        const token = tokenFrom(getMockRecoveryLink("maria@teste.com"));

        now.mockReturnValue(start + oneHour + 1);
        await expect(
            resetMockPassword({ token, password: "novaSenha1" }),
        ).resolves.toBe(false);

        await expect(
            loginMock({ email: "maria@teste.com", password: "senhaAntiga1" }),
        ).resolves.toBeTruthy();
    });

    it("trata dados corrompidos no localStorage como se não houvesse token", async () => {
        localStorage.setItem(recoveryTokensKey, "{{ não é json");

        await expect(
            resetMockPassword({ token: "qualquer", password: "novaSenha1" }),
        ).resolves.toBe(false);
        expect(getMockRecoveryLink("ana@exemplo.com")).toBeNull();
    });
});
