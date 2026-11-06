import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/app/App";

function renderAt(route: string) {
    window.location.hash = `#${route}`;
    return render(<App />);
}

describe("App — rotas da recuperação de acesso (HU10)", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = "";
    });

    it("abre a solicitação de recuperação sem a barra de navegação inferior", async () => {
        const { container } = renderAt("/recuperar-acesso");

        expect(
            await screen.findByRole("heading", {
                name: "Vamos recuperar seu acesso",
            }),
        ).toBeTruthy();
        expect(container.querySelector(".auth-shell")).not.toBeNull();
    });

    it("abre a tela de nova senha pelo link com token, também sem a barra inferior", async () => {
        const { container } = renderAt("/redefinir-senha?token=abc123");

        expect(
            await screen.findByRole("heading", { name: "Crie uma nova senha" }),
        ).toBeTruthy();
        expect(container.querySelector(".auth-shell")).not.toBeNull();
    });

    it("mostra a orientação de link inválido quando o link não tem token", async () => {
        renderAt("/redefinir-senha");

        expect(
            await screen.findByRole("heading", {
                name: "Link de recuperação inválido",
            }),
        ).toBeTruthy();
    });

    it("avisa a senha redefinida no login quando a rota traz recuperacao=ok", async () => {
        renderAt("/entrar?recuperacao=ok");

        expect(
            await screen.findByText(
                "Senha redefinida. Entre com seu e-mail e a nova senha.",
            ),
        ).toBeTruthy();
    });

    it("não mostra o aviso de senha redefinida no login comum", async () => {
        renderAt("/entrar");

        await screen.findByRole("heading", { name: "Que bom ter você aqui" });
        expect(screen.queryByText(/Senha redefinida/)).toBeNull();
    });

    it("leva do login para a recuperação de acesso pelo botão", async () => {
        renderAt("/entrar");

        await userEvent
            .setup()
            .click(
                await screen.findByRole("button", { name: "Recuperar acesso" }),
            );

        expect(
            await screen.findByRole("heading", {
                name: "Vamos recuperar seu acesso",
            }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/recuperar-acesso");
    });
});