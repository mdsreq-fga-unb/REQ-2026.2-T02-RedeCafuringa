import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { registerMockConsumer } from "@/features/auth/mockAuth";

// Força a simulação para o login e a recuperação usarem o mesmo mock em memória.
vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

type ConsumerData = Parameters<typeof registerMockConsumer>[0];

describe("HU10 — fluxo completo de recuperação de acesso", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = "";
    });

    it("pede o link, define a nova senha e entra com ela", async () => {
        await registerMockConsumer({
            nome: "Maria Teste",
            cpf: "390.533.447-05",
            email: "maria@teste.com",
            senha: "senhaAntiga1",
        } as ConsumerData);
        window.location.hash = "#/entrar";
        const user = userEvent.setup();
        render(<App />);

        // Telas 08 e 09: pedir o link
        await user.click(
            await screen.findByRole("button", { name: "Recuperar acesso" }),
        );
        await user.type(
            await screen.findByLabelText("E-mail"),
            "maria@teste.com",
        );
        await user.click(
            screen.getByRole("button", { name: "Enviar instruções" }),
        );

        // Tela 10: abrir o link (no lugar do e-mail real) e definir a nova senha
        await user.click(
            await screen.findByRole("link", {
                name: "abrir link de redefinição",
            }),
        );
        await user.type(
            await screen.findByLabelText("Nova senha"),
            "novaSenha1",
        );
        await user.type(
            screen.getByLabelText("Confirmar nova senha"),
            "novaSenha1",
        );
        await user.click(
            screen.getByRole("button", { name: "Salvar e entrar" }),
        );

        // Login com a senha nova
        expect(
            await screen.findByText(
                "Senha redefinida. Entre com seu e-mail e a nova senha.",
            ),
        ).toBeTruthy();
        await user.type(screen.getByLabelText("E-mail"), "maria@teste.com");
        await user.type(screen.getByLabelText("Senha"), "novaSenha1");
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        await waitFor(() => expect(window.location.hash).toBe("#/conta"));
    });
});
