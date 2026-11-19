import {
    cleanup,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
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

    // Critério 2 e HU39 (redirect): depois do login vai para a página
    // principal do perfil (protótipo: consumidor em Explorar, produtor no
    // Início/Painel, que no app é a mesma aba /explorar), e não para a Conta.
    it.each([
        ["consumidor", consumerAuth],
        ["produtor", producerAuth],
    ] as const)(
        "leva o %s autenticado à página principal (Explorar/Painel)",
        async (_profile, auth) => {
            vi.mocked(login).mockResolvedValue(auth);
            window.location.hash = "#/entrar";
            render(<App />);

            await submitLogin(userEvent.setup());

            await waitFor(() =>
                expect(window.location.hash).toBe("#/explorar"),
            );
            const nav = await screen.findByRole("navigation", {
                name: "Navegação principal",
            });
            expect(
                nav.querySelector('[aria-current="page"]')?.textContent,
            ).toMatch(auth.user.role === "producer" ? /Painel/ : /Explorar/);
        },
    );

    it("a Conta continua mostrando os dados do consumidor autenticado", async () => {
        vi.mocked(login).mockResolvedValue(consumerAuth);
        window.location.hash = "#/entrar";
        render(<App />);
        const user = userEvent.setup();

        await submitLogin(user);
        await waitFor(() => expect(window.location.hash).toBe("#/explorar"));
        await user.click(screen.getByRole("button", { name: /^Conta$/ }));

        expect(
            await screen.findByRole("heading", {
                name: "Olá, Gabriela",
            }),
        ).toBeTruthy();
        const details = screen.getByRole("region", { name: "Dados da conta" });
        expect(within(details).getByText("gabriela@exemplo.com")).toBeTruthy();
        expect(within(details).getByText("529.982.247-25")).toBeTruthy();
        expect(window.location.hash).toBe("#/conta");
    });

    // Critério 3 e HU39 CA03: com a API real, a autorização do contato público
    // é gravada em "Minha trajetória" (HU12), não no aparelho.
    it("mostra ao produtor onde gerenciar o contato público", async () => {
        vi.mocked(login).mockResolvedValue(producerAuth);
        window.location.hash = "#/entrar";
        render(<App />);
        const user = userEvent.setup();

        await submitLogin(user);
        await waitFor(() => expect(window.location.hash).toBe("#/explorar"));
        await user.click(screen.getByRole("button", { name: /^Conta$/ }));
        expect(
            await screen.findByRole("heading", { name: "Contato público" }),
        ).toBeTruthy();
        expect(
            screen.queryByLabelText("WhatsApp com código do país"),
        ).toBeNull();
        expect(
            screen.getByText(/autorize a divulgação em Minha trajetória/),
        ).toBeTruthy();
        await user.click(
            screen.getByRole("button", {
                name: "Configurar contato público",
            }),
        );
        await waitFor(() =>
            expect(window.location.hash).toBe("#/minha-trajetoria?contato=1"),
        );
        expect(
            screen.getByRole("heading", { name: "Conte sua história" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", {
                name: "Entre para falar com a responsável",
            }),
        ).toBeNull();
    });

    it("não mostra o contato público para o consumidor", async () => {
        vi.mocked(login).mockResolvedValue(consumerAuth);
        window.location.hash = "#/entrar";
        render(<App />);
        const user = userEvent.setup();

        await submitLogin(user);
        await waitFor(() => expect(window.location.hash).toBe("#/explorar"));
        await user.click(screen.getByRole("button", { name: /^Conta$/ }));

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
