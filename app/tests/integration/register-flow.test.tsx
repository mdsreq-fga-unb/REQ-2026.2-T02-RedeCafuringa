import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";

// Cadastro e login usam o modo mock: o cadastro real (registerService) grava a
// conta onde o login mock (loginMock) procura.
vi.mock("@/features/auth/authService", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("@/features/auth/authService")>();
    const { loginMock } = await import("@/features/auth/mockAuth");
    return { ...original, isMockAuthEnabled: true, login: loginMock };
});

const newCpf = "39053344705";
const newPassword = "senha-segura-1";

async function fillRegisterForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Nome da iniciativa"), "Seu João");
    await user.type(screen.getByLabelText("CPF"), newCpf);
    await user.type(screen.getByLabelText("Data de nascimento"), "10051990");
    await user.type(screen.getByLabelText("Telefone"), "61912345678");
    await user.type(screen.getByLabelText("E-mail"), "joao@exemplo.com");
    await user.type(
        screen.getByLabelText("Localidade"),
        "Chácara 7, Núcleo Rural, Brasília - DF",
    );
    await user.type(screen.getByLabelText("Senha"), newPassword);
    await user.type(screen.getByLabelText("Confirmar senha"), newPassword);
}

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
            screen.getByRole("heading", { name: "Cadastro de produtor" }),
        ).toBeTruthy();
    });

    it("leva do login ao cadastro pelo botão Criar uma conta", async () => {
        window.location.hash = "#/entrar";
        render(<App />);

        await userEvent.setup().click(
            screen.getByRole("button", {
                name: "Criar conta de produtor",
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Cadastro de produtor",
            }),
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

describe("HU02 — do cadastro à área do produtor", () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = "";
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = "";
    });

    // Critério 9
    it("cadastra o produtor e exibe a confirmação antes de entrar", async () => {
        window.location.hash = "#/entrar";
        render(<App />);
        const user = userEvent.setup();

        await user.click(
            screen.getByRole("button", { name: "Criar conta de produtor" }),
        );
        await fillRegisterForm(user);
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        expect(
            await screen.findByRole("heading", {
                name: "Você já faz parte da rede",
            }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/conta-criada/producer");

        await user.click(
            screen.getByRole("button", { name: "Entrar na minha conta" }),
        );

        expect(window.location.hash).toBe("#/login/producer");
    }, 15000);

    // Critério 9, caso CNPJ: depende da mudança pendente da HU09
    it.todo(
        "entra com a conta criada com CNPJ (login deve aceitar CPF ou CNPJ)",
    );
});
