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

        window.location.hash = "#/cadastro/administrador";
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
});
