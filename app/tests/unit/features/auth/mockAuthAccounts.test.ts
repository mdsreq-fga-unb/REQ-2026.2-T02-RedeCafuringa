import { describe, expect, it } from "vitest";
import { InvalidCredentialsError } from "@/features/auth/errors";
import { loginMock, registerMockUser } from "@/features/auth/mockAuth";

describe("mockAuth — contas criadas pelo cadastro (HU02, critério 9)", () => {
    it("reconhece no login uma conta recém-cadastrada", async () => {
        registerMockUser({
            cpf: "39053344705",
            password: "senha123",
            name: "Seu João",
            role: "producer",
        });

        const auth = await loginMock({
            cpf: "39053344705",
            password: "senha123",
        });

        expect(auth.user.name).toBe("Seu João");
        expect(auth.user.role).toBe("producer");
        expect(auth.token).toMatch(/^mock-token-/);
    });

    it("continua recusando senha errada para uma conta cadastrada", async () => {
        registerMockUser({
            cpf: "86288366757",
            password: "senha123",
            name: "Dona Ana",
            role: "producer",
        });

        await expect(
            loginMock({ cpf: "86288366757", password: "outra-senha1" }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("dá um id novo a cada conta, sem repetir os usuários de demonstração", () => {
        const first = registerMockUser({
            cpf: "11122233396",
            password: "senha123",
            name: "Primeiro",
            role: "producer",
        });
        const second = registerMockUser({
            cpf: "74489611016",
            password: "senha123",
            name: "Segundo",
            role: "producer",
        });

        expect(first.id).not.toBe(second.id);
        expect([first.id, second.id]).not.toContain(1);
        expect([first.id, second.id]).not.toContain(2);
    });

    it("mantém os usuários de demonstração funcionando", async () => {
        const auth = await loginMock({
            cpf: "52998224725",
            password: "senha123",
        });

        expect(auth.user.role).toBe("consumer");
    });
});
