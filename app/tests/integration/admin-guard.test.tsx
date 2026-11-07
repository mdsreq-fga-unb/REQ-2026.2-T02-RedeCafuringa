import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
});

describe("área administrativa — RN03/RNF08/CA06", () => {
    it.each(["#/cadastro/administrador", "#/conta-criada/admin"])(
        "sem sessão, %s redireciona para o login administrativo",
        async (hash) => {
            window.location.hash = hash;
            render(<App />);

            await waitFor(() =>
                expect(window.location.hash).toBe("#/admin/entrar"),
            );
            expect(
                screen.queryByRole("heading", {
                    name: "Cadastro de administrador",
                }),
            ).toBeNull();
        },
    );

    it("consumidor logado também é barrado", async () => {
        localStorage.setItem("cafuringa-role", "consumer");
        window.location.hash = "#/cadastro/administrador";
        render(<App />);

        await waitFor(() =>
            expect(window.location.hash).toBe("#/admin/entrar"),
        );
    });

    it("fluxo completo no modo mock: entra como admin, cadastra outro e o novo entra", async () => {
        const user = userEvent.setup();
        window.location.hash = "#/admin/entrar";
        render(<App />);

        await user.type(screen.getByLabelText("E-mail"), "admin@exemplo.com");
        await user.type(screen.getByLabelText("Senha"), "senha123");
        await user.click(screen.getByRole("button", { name: "Entrar" }));
        await waitFor(() =>
            expect(window.location.hash).toBe("#/admin/acesso"),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Funções do administrador",
            }),
        ).toBeTruthy();
        expect(
            screen.getByRole("link", {
                name: /consultar usuários cadastrados/i,
            }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Entrar como adm" }),
        ).toBeNull();
        await user.click(
            screen.getByRole("link", { name: /cadastrar administrador/i }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Cadastro de administrador",
            }),
        ).toBeTruthy();
        await user.type(screen.getByLabelText("E-mail"), "novo@exemplo.com");
        await user.type(screen.getByLabelText("Senha"), "SenhaForte123");
        await user.type(
            screen.getByLabelText("Confirmar senha"),
            "SenhaForte123",
        );
        await user.click(screen.getByRole("button", { name: "Entrar" }));
        expect(
            await screen.findByRole("heading", {
                name: "Usuário admin cadastrado com sucesso!",
            }),
        ).toBeTruthy();
    });

    it("atalho de administrador de teste também abre diretamente as funções", async () => {
        const user = userEvent.setup();
        window.location.hash = "#/escolher-perfil";
        render(<App />);
        await user.click(screen.getByText("Modo local · Explorar telas"));
        await user.click(
            screen.getByRole("button", {
                name: "Entrar como administrador de teste",
            }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Funções do administrador",
            }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/admin/acesso");
        expect(
            screen.queryByRole("button", { name: "Entrar como adm" }),
        ).toBeNull();
    });
});
