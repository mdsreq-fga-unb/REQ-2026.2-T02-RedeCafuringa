import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    registerMockAdmin,
    registerMockConsumer,
} from "@/features/auth/mockAuth";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    localStorage.clear();
    fetchMock
        .mockReset()
        .mockRejectedValue(new Error("Modo mock não deve acessar a API"));
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("cafuringa-role", "admin");
    localStorage.setItem("cafuringa-token", "mock-token-3");
    window.location.hash = "#/admin/usuarios";
});

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

describe("HU04 — compatibilidade com a demonstração existente", () => {
    it("CA01–CA05: exibe os três perfis sem depender da rede", async () => {
        render(<App />);
        expect(
            await screen.findByRole("heading", {
                name: /usuários cadastrados/i,
            }),
        ).toBeTruthy();
        for (const perfil of [
            /^consumidor(a)?$/i,
            /^produtor(a)?$/i,
            /^administrador(a)?$/i,
        ]) {
            expect(screen.getAllByText(perfil).length).toBeGreaterThan(0);
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("consulta contas criadas nos cadastros mock existentes e abre os detalhes sem senha", async () => {
        await registerMockConsumer({
            nome: "Consumidora Criada no Teste",
            email: "consumidora.nova@exemplo.com",
            cpf: "12345678909",
            dataNascimento: "01-01-1990",
            senha: "SegredoConsumidor123",
        });
        await registerMockAdmin({
            email: "gestora.nova@exemplo.com",
            senha: "SegredoAdmin123",
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { name: /usuários cadastrados/i });
        await user.type(
            screen.getByRole("searchbox", { name: /buscar usuário/i }),
            "Consumidora Criada no Teste",
        );
        expect(
            await screen.findByText("Consumidora Criada no Teste"),
        ).toBeTruthy();
        // Após filtrar, existe apenas uma ação de detalhe, acionável pelo teclado.
        const details =
            screen.queryByRole("link", { name: /detalhes/i }) ??
            screen.getByRole("button", { name: /detalhes/i });
        details.focus();
        await user.keyboard("{Enter}");
        await waitFor(() =>
            expect(window.location.hash).toMatch(/^#\/admin\/usuarios\/.+/),
        );
        await waitFor(() => {
            const email = "consumidora.nova@exemplo.com";
            expect(
                [
                    ...screen.queryAllByText(email),
                    ...screen.queryAllByDisplayValue(email),
                ].length,
            ).toBeGreaterThan(0);
        });
        expect(screen.queryByLabelText(/senha/i)).toBeNull();
        expect(document.body.innerHTML).not.toContain("SegredoConsumidor123");
        expect(document.body.innerHTML).not.toContain("SegredoAdmin123");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("inclui administradores cadastrados na demonstração ao buscar pelo e-mail", async () => {
        await registerMockAdmin({
            email: "gestora.nova@exemplo.com",
            senha: "SegredoAdmin123",
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { name: /usuários cadastrados/i });
        await user.type(
            screen.getByRole("searchbox", { name: /buscar usuário/i }),
            "gestora.nova@exemplo.com",
        );
        await waitFor(() => {
            const details = [
                ...screen.queryAllByRole("link", { name: /detalhes/i }),
                ...screen.queryAllByRole("button", { name: /detalhes/i }),
            ];
            expect(details).toHaveLength(1);
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("CA08: busca sem correspondência informa lista vazia", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { name: /usuários cadastrados/i });
        await user.type(
            screen.getByRole("searchbox", { name: /buscar usuário/i }),
            "usuario-inexistente-xyz",
        );
        expect(
            await screen.findByText(/nenhum usuário|não há usuários/i),
        ).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
