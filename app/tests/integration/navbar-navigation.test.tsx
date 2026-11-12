import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { json } from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "#/conta");
    vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === "/api/v1/auth/me")
                return json({
                    id: "u1",
                    nome: "Maria",
                    email: "maria@example.com",
                    perfil: "CONSUMIDOR",
                });
            if (path === "/api/v1/producers") return json([]);
            throw new Error(`Requisição inesperada: ${path}`);
        }),
    );
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState(null, "", window.location.pathname);
    vi.unstubAllGlobals();
});

describe("navegação da navbar", () => {
    it.each(["", "#/", "#/rota-desconhecida"])(
        "abre Explorar ao entrar pelo endereço inicial %s",
        async (hash) => {
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${hash}`,
            );
            render(<App />);
            expect(
                await screen.findByRole("heading", {
                    name: "Conheça nossos produtores",
                }),
            ).toBeTruthy();
            expect(
                screen.queryByRole("heading", { name: "Dona Maria" }),
            ).toBeNull();
            expect(
                screen.queryByRole("heading", { name: /Entre em sua conta/ }),
            ).toBeNull();
        },
    );
    it.each(["consumer", "producer"] as const)(
        "casinha abre Explorar e preserva a sessão de %s",
        async (role) => {
            localStorage.setItem("cafuringa-role", role);
            localStorage.setItem("cafuringa-token", "jwt-navbar");
            const user = userEvent.setup();
            render(<App />);
            await user.click(screen.getByRole("button", { name: "Explorar" }));
            expect(
                await screen.findByRole("heading", {
                    name: "Conheça nossos produtores",
                }),
            ).toBeTruthy();
            expect(window.location.hash).toBe("#/explorar");
            expect(
                screen.queryByRole("heading", { name: /Entre em sua conta/ }),
            ).toBeNull();
            expect(localStorage.getItem("cafuringa-token")).toBe("jwt-navbar");
            await user.click(screen.getByRole("button", { name: "Conta" }));
            await waitFor(() => expect(window.location.hash).toBe("#/conta"));
            expect(
                screen.queryByRole("heading", { name: /Entre em sua conta/ }),
            ).toBeNull();
            expect(localStorage.getItem("cafuringa-role")).toBe(role);
        },
    );

    it("atualiza a tela ao clicar no início mesmo quando o hash de destino já está na URL", async () => {
        localStorage.setItem("cafuringa-role", "consumer");
        localStorage.setItem("cafuringa-token", "jwt-navbar");
        window.history.replaceState(null, "", "#/entrar");
        const user = userEvent.setup();
        render(<App />);
        // replaceState não emite hashchange: reproduz endereço e tela fora de sincronia.
        act(() => window.history.replaceState(null, "", "#/explorar"));
        await user.click(
            screen.getByRole("button", { name: "Cafuringa, início" }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Conheça nossos produtores",
            }),
        ).toBeTruthy();
        expect(screen.queryByLabelText("Senha")).toBeNull();
        expect(localStorage.getItem("cafuringa-token")).toBe("jwt-navbar");
    });

    it("visitante também abre Explorar sem exigir login", async () => {
        window.location.hash = "#/perfil";
        const user = userEvent.setup();
        render(<App />);
        await user.click(screen.getByRole("button", { name: "Explorar" }));
        expect(
            await screen.findByRole("heading", {
                name: "Conheça nossos produtores",
            }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", { name: /Entre em sua conta/ }),
        ).toBeNull();
    });
});
