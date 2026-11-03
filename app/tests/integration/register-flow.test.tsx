import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/app/App";

describe("HU02 — acesso ao cadastro de produtor no app", () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = "";
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = "";
    });

    // Critério 1 (acesso sem conta)
    it("abre a tela de cadastro direto pela rota /cadastro", () => {
        window.location.hash = "#/cadastro";
        render(<App />);

        expect(
            screen.getByRole("heading", { name: "Cadastre seu perfil" }),
        ).toBeTruthy();
    });

    it("leva do login ao cadastro pelo botão Criar uma conta", async () => {
        window.location.hash = "#/entrar";
        render(<App />);

        await userEvent
            .setup()
            .click(screen.getByRole("button", { name: "Criar uma conta" }));

        expect(
            await screen.findByRole("heading", { name: "Cadastre seu perfil" }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/cadastro");
    });

    // Critério 9 (depois do cadastro, o usuário vai para o login)
    it("mostra o aviso de cadastro concluído ao chegar no login vindo do cadastro", () => {
        window.location.hash = "#/entrar?cadastro=ok";
        render(<App />);

        expect(screen.getByRole("status").textContent).toBe(
            "Cadastro concluído. Entre com seu CPF e sua senha.",
        );
    });

    it("não mostra o aviso de cadastro no login comum", () => {
        window.location.hash = "#/entrar";
        render(<App />);

        expect(screen.queryByRole("status")).toBeNull();
    });
});