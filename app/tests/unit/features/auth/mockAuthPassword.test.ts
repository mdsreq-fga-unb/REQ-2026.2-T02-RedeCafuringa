import { beforeEach, describe, expect, it } from "vitest";
import { InvalidCredentialsError } from "@/features/auth/errors";
import {
    isMockEmailRegistered,
    loginMock,
    registerMockAdmin,
    registerMockConsumer,
    updateMockPassword,
} from "@/features/auth/mockAuth";

type ConsumerData = Parameters<typeof registerMockConsumer>[0];

async function registerConsumer(email: string, senha: string) {
    await registerMockConsumer({
        nome: "Maria Teste",
        cpf: "390.533.447-05",
        email,
        senha,
    } as ConsumerData);
}

describe("mockAuth — e-mail e senha para a recuperação de acesso (HU10)", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("reconhece o e-mail de um usuário fixo, sem diferenciar maiúsculas nem espaços", () => {
        expect(isMockEmailRegistered("  Ana@Exemplo.com ")).toBe(true);
    });

    it("não reconhece um e-mail sem conta", () => {
        expect(isMockEmailRegistered("ninguem@exemplo.com")).toBe(false);
    });

    it("reconhece o e-mail de um consumidor cadastrado", async () => {
        await registerConsumer("maria@teste.com", "senhaAntiga1");

        expect(isMockEmailRegistered("maria@teste.com")).toBe(true);
    });

    it("reconhece o e-mail de um administrador cadastrado", async () => {
        await registerMockAdmin({
            email: "novo.admin@exemplo.com",
            senha: "senhaAntiga1",
        });

        expect(isMockEmailRegistered("novo.admin@exemplo.com")).toBe(true);
    });

    it("altera a senha de um usuário fixo", async () => {
        try {
            expect(updateMockPassword("ana@exemplo.com", "novaSenha1")).toBe(
                true,
            );

            const auth = await loginMock({
                email: "ana@exemplo.com",
                password: "novaSenha1",
            });
            expect(auth.user.role).toBe("consumer");
            await expect(
                loginMock({ email: "ana@exemplo.com", password: "senha123" }),
            ).rejects.toBeInstanceOf(InvalidCredentialsError);
        } finally {
            updateMockPassword("ana@exemplo.com", "senha123");
        }
    });

    it("altera a senha de um consumidor cadastrado", async () => {
        await registerConsumer("maria@teste.com", "senhaAntiga1");

        expect(updateMockPassword("Maria@Teste.com", "novaSenha1")).toBe(true);

        const auth = await loginMock({
            email: "maria@teste.com",
            password: "novaSenha1",
        });
        expect(auth.user.name).toBe("Maria Teste");
    });

    it("altera a senha de um administrador cadastrado", async () => {
        await registerMockAdmin({
            email: "novo.admin@exemplo.com",
            senha: "senhaAntiga1",
        });

        expect(updateMockPassword("novo.admin@exemplo.com", "novaSenha1")).toBe(
            true,
        );

        const auth = await loginMock({
            email: "novo.admin@exemplo.com",
            password: "novaSenha1",
        });
        expect(auth.user.role).toBe("admin");
    });

    it("não altera nada quando o e-mail não tem conta", () => {
        expect(updateMockPassword("ninguem@exemplo.com", "novaSenha1")).toBe(
            false,
        );
        expect(localStorage.length).toBe(0);
    });
});
