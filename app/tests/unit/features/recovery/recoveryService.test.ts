import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerMockConsumer } from "@/features/auth/mockAuth";
import { getMockRecoveryLink } from "@/features/recovery/mockRecovery";
import { createRecoveryService } from "@/features/recovery/recoveryService";
import { ApiHttpError } from "@/shared/api";

type ConsumerData = Parameters<typeof registerMockConsumer>[0];

function httpError(status: number, extra: { retryAfterSeconds?: number } = {}) {
    return Object.assign(Object.create(ApiHttpError.prototype), {
        status,
        message: `HTTP ${status}`,
        details: [],
        ...extra,
    }) as ApiHttpError;
}

function createService(options: { useMock?: boolean } = {}) {
    const post = vi.fn();
    const service = createRecoveryService({
        useMock: options.useMock ?? false,
        getClient: () => ({ post }) as never,
    });
    return { service, post };
}

async function registerConsumer(email: string, senha: string) {
    await registerMockConsumer({
        nome: "Maria Teste",
        cpf: "390.533.447-05",
        email,
        senha,
    } as ConsumerData);
}

describe("recoveryService — API real (HU10)", () => {
    it("pede a recuperação com o e-mail normalizado, sem token de sessão", async () => {
        const { service, post } = createService();
        post.mockResolvedValue(undefined);

        const result = await service.requestAccessRecovery("  Ana@Exemplo.com ");

        expect(result).toEqual({ ok: true });
        expect(post).toHaveBeenCalledWith(
            "/auth/recuperar-acesso",
            { email: "ana@exemplo.com" },
            { auth: false },
        );
    });

    it("informa o limite de tentativas ao pedir a recuperação", async () => {
        const { service, post } = createService();
        post.mockRejectedValue(httpError(429, { retryAfterSeconds: 30 }));

        await expect(
            service.requestAccessRecovery("ana@exemplo.com"),
        ).resolves.toEqual({
            ok: false,
            reason: "rate_limit",
            retryAfterSeconds: 30,
        });
    });

    it("trata falhas de rede ou do servidor ao pedir a recuperação como erro", async () => {
        const { service, post } = createService();
        post.mockRejectedValue(new Error("rede"));

        await expect(
            service.requestAccessRecovery("ana@exemplo.com"),
        ).resolves.toEqual({ ok: false, reason: "error" });
    });

    it("redefine a senha enviando token e novaSenha, sem token de sessão", async () => {
        const { service, post } = createService();
        post.mockResolvedValue(undefined);

        const result = await service.resetPassword({
            token: "abc123",
            password: "novaSenha1",
        });

        expect(result).toEqual({ ok: true });
        expect(post).toHaveBeenCalledWith(
            "/auth/redefinir-senha",
            { token: "abc123", novaSenha: "novaSenha1" },
            { auth: false },
        );
    });

    it("trata o 400 da redefinição como token inválido ou expirado", async () => {
        const { service, post } = createService();
        post.mockRejectedValue(httpError(400));

        await expect(
            service.resetPassword({ token: "velho", password: "novaSenha1" }),
        ).resolves.toEqual({ ok: false, reason: "invalid_token" });
    });

    it("informa o limite de tentativas ao redefinir a senha", async () => {
        const { service, post } = createService();
        post.mockRejectedValue(httpError(429, { retryAfterSeconds: 60 }));

        await expect(
            service.resetPassword({ token: "abc123", password: "novaSenha1" }),
        ).resolves.toEqual({
            ok: false,
            reason: "rate_limit",
            retryAfterSeconds: 60,
        });
    });

    it("trata falhas de rede ou do servidor ao redefinir como erro", async () => {
        const { service, post } = createService();
        post.mockRejectedValue(httpError(500));

        await expect(
            service.resetPassword({ token: "abc123", password: "novaSenha1" }),
        ).resolves.toEqual({ ok: false, reason: "error" });
    });
});

describe("recoveryService — simulação (modo mock)", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("responde ok para qualquer e-mail, sem chamar a API", async () => {
        const { service, post } = createService({ useMock: true });

        await expect(
            service.requestAccessRecovery("ninguem@exemplo.com"),
        ).resolves.toEqual({ ok: true });

        expect(post).not.toHaveBeenCalled();
        expect(getMockRecoveryLink("ninguem@exemplo.com")).toBeNull();
    });

    it("redefine a senha com o link gerado e recusa o token já usado", async () => {
        const { service, post } = createService({ useMock: true });
        await registerConsumer("maria@teste.com", "senhaAntiga1");
        await service.requestAccessRecovery("maria@teste.com");
        const token = (getMockRecoveryLink("maria@teste.com") ?? "").split(
            "token=",
        )[1];

        await expect(
            service.resetPassword({ token, password: "novaSenha1" }),
        ).resolves.toEqual({ ok: true });
        await expect(
            service.resetPassword({ token, password: "outraSenha2" }),
        ).resolves.toEqual({ ok: false, reason: "invalid_token" });
        expect(post).not.toHaveBeenCalled();
    });

    it("recusa um token inexistente como inválido", async () => {
        const { service } = createService({ useMock: true });

        await expect(
            service.resetPassword({ token: "nada", password: "novaSenha1" }),
        ).resolves.toEqual({ ok: false, reason: "invalid_token" });
    });
});