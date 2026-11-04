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
    await user.type(await screen.findByLabelText("CPF"), "52998224725");
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
        ["consumer", "Criar conta de consumidor", "Criar conta de produtor"],
        ["producer", "Criar conta de produtor", "Criar conta de consumidor"],
    ] as const)(
        "shows only the %s signup action on its login route",
        async (profile, signupLabel, otherSignupLabel) => {
            window.location.hash = `#/login/${profile}`;
            render(<App />);

            expect(
                await screen.findByRole("button", { name: signupLabel }),
            ).toBeTruthy();
            expect(
                screen.queryByRole("button", { name: otherSignupLabel }),
            ).toBeNull();
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
