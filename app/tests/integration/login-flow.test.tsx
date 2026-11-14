import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { login } from "@/features/auth/authService";
import type { AuthResult } from "@/shared/types";

vi.mock("@/features/auth/authService");

const consumerAuth: AuthResult = {
    token: "token-consumidor",
    user: {
        id: 1,
        name: "Gabriela Pereira da Silva",
        role: "consumer",
        email: "gabriela@exemplo.com",
        cpf: "52998224725",
    },
};
const producerAuth: AuthResult = {
    token: "token-produtor",
    user: { id: 2, name: "Dona Maria", role: "producer" },
};

async function submitLogin(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
        await screen.findByLabelText("E-mail"),
        "gabriela@exemplo.com",
    );
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("HU09 — fluxo de autenticação no app", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        window.location.hash = "";
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = "";
    });

    it.each([
        ["consumer", "#/cadastro/consumidor"],
        ["producer", "#/cadastro"],
    ] as const)(
        "leva o login de %s ao cadastro do seu perfil pela única ação Criar uma conta",
        async (profile, expectedHash) => {
            window.location.hash = `#/login/${profile}`;
            render(<App />);

            const buttons = await screen.findAllByRole("button", {
                name: "Criar uma conta",
            });
            expect(buttons).toHaveLength(1);

            await userEvent.setup().click(buttons[0]);

            await waitFor(() =>
                expect(window.location.hash).toBe(expectedHash),
            );
        },
    );

    // Critério 2
    it("leva o consumidor autenticado à área da conta com o nome dele", async () => {
        vi.mocked(login).mockResolvedValue(consumerAuth);
        window.location.hash = "#/entrar";
        render(<App />);

        await submitLogin(userEvent.setup());

        expect(
            await screen.findByRole("heading", {
                name: "Olá, Gabriela",
            }),
        ).toBeTruthy();
        expect(screen.getByLabelText("E-mail")).toHaveProperty(
            "value",
            "gabriela@exemplo.com",
        );
        expect(screen.getByLabelText("CPF")).toHaveProperty(
            "value",
            "529.982.247-25",
        );
        expect(window.location.hash).toBe("#/conta");
    });

    // Critério 3
    it("mostra o contato público só para o produtor", async () => {
        vi.mocked(login).mockResolvedValue(producerAuth);
        window.location.hash = "#/entrar";
        render(<App />);

        await submitLogin(userEvent.setup());

        await userEvent
            .setup()
            .click(
                screen.getByText("Contato público", { selector: "summary" }),
            );

        expect(
            await screen.findByRole("heading", { name: "Contato público" }),
        ).toBeTruthy();
    });

    it("não mostra o contato público para o consumidor", async () => {
        vi.mocked(login).mockResolvedValue(consumerAuth);
        window.location.hash = "#/entrar";
        render(<App />);

        await submitLogin(userEvent.setup());

        await screen.findByRole("heading", {
            name: "Olá, Gabriela",
        });
        expect(
            screen.queryByRole("heading", { name: "Contato público" }),
        ).toBeNull();
    });

    // Critério 6
    it("mostra a seleção de perfil quando um visitante abre a área da conta", () => {
        window.location.hash = "#/conta";
        render(<App />);

        expect(
            screen.getByRole("heading", { name: "Entre em sua conta" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Sair da conta" }),
        ).toBeNull();
    });

    it("abre a área da conta direto quando já existe sessão", () => {
        localStorage.setItem("cafuringa-role", "consumer");
        localStorage.setItem("cafuringa-name", "Gabriela Pereira da Silva");
        window.location.hash = "#/conta";
        render(<App />);

        expect(
            screen.getByRole("heading", { name: "Olá, Gabriela" }),
        ).toBeTruthy();
    });

    it("ao sair, volta à seleção de perfil", async () => {
        localStorage.setItem("cafuringa-role", "consumer");
        localStorage.setItem("cafuringa-name", "Gabriela Pereira da Silva");
        window.location.hash = "#/conta";
        render(<App />);

        await userEvent
            .setup()
            .click(screen.getByRole("button", { name: "Sair da conta" }));

        await waitFor(() =>
            expect(window.location.hash).toBe("#/escolher-perfil"),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole("heading", {
                    name: "Entre em sua conta",
                }),
            ).toBeTruthy(),
        );
    });
});
