import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { json } from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const resposta = {
    termo: "cafe",
    produtores: {
        itens: [
            {
                id: "p1",
                nomeIniciativa: "Dona Maria",
                categoriaOfertada: "Produtos",
                trajetoria: "Plantamos café há 20 anos.",
            },
        ],
        total: 1,
    },
    produtos: {
        itens: [
            {
                id: "cafe",
                nome: "Café torrado",
                categoria: "Produtos",
                descricao: "Grãos da safra.",
                precoPorUnidade: 32,
                gramasPorUnidade: 250,
                fotos: [],
                produtor: { id: "p1", nomeIniciativa: "Sítio Raízes" },
                criadoEm: "2026-11-13T12:00:00.000Z",
                disponivel: true,
            },
        ],
        total: 1,
    },
    experiencias: { itens: [], total: 0 },
};

const emptyPage = { itens: [], total: 0, pagina: 1, limite: 20 };

function api() {
    const fetchMock = vi.fn<typeof fetch>((input) => {
        const url = new URL(String(input), "http://localhost");
        if (url.pathname === "/api/v1/search")
            return Promise.resolve(
                json({
                    ...resposta,
                    termo: url.searchParams.get("busca") ?? "",
                }),
            );
        if (url.pathname === "/api/v1/producers")
            return Promise.resolve(json([]));
        if (
            url.pathname.endsWith("/products") ||
            url.pathname.endsWith("/experiences")
        )
            return Promise.resolve(json(emptyPage));
        return Promise.resolve(json({ message: "não encontrado" }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

const searchCalls = (fetchMock: ReturnType<typeof api>) =>
    fetchMock.mock.calls.filter(([input]) => String(input).includes("/search"));

beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/explorar";
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("HU36 — buscar ofertas no app", () => {
    it("CA01, CA02, CA09: visitante busca no Explorar e vê os resultados, sem login", async () => {
        const fetchMock = api();
        const user = userEvent.setup();
        render(<App />);

        await user.type(await screen.findByRole("searchbox"), "café{Enter}");

        await screen.findByRole("heading", {
            level: 1,
            name: "Buscar ofertas",
        });
        expect(decodeURIComponent(window.location.hash)).toBe(
            "#/buscar?q=café",
        );
        await screen.findByRole("heading", { name: "Produtos (1)" });
        expect(
            screen.getByRole("button", { name: /Café torrado/ }),
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: /Dona Maria/ })).toBeTruthy();

        const [[url, init]] = searchCalls(fetchMock);
        expect(
            new URL(String(url), "http://localhost").searchParams.get("busca"),
        ).toBe("café");
        expect(new Headers(init?.headers).has("Authorization")).toBe(false);
    });

    it("CA08: termo inválido no Explorar orienta o usuário e não sai da tela nem busca", async () => {
        const fetchMock = api();
        const user = userEvent.setup();
        render(<App />);

        await user.type(await screen.findByRole("searchbox"), "a{Enter}");

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Digite pelo menos 2 caracteres para buscar.",
        );
        expect(window.location.hash).toBe("#/explorar");
        expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe(
            "a",
        );
        expect(searchCalls(fetchMock)).toHaveLength(0);
    });

    it("abre direto pelo endereço da busca", async () => {
        const fetchMock = api();
        window.location.hash = "#/buscar?q=cafe";
        render(<App />);

        await screen.findByRole("heading", { name: "Produtos (1)" });
        expect(
            (
                screen.getByRole("searchbox", {
                    name: "O que você procura?",
                }) as HTMLInputElement
            ).value,
        ).toBe("cafe");
        expect(searchCalls(fetchMock)).toHaveLength(1);
    });

    it("CA07: nova busca na própria tela de resultados", async () => {
        const fetchMock = api();
        window.location.hash = "#/buscar?q=cafe";
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { name: "Produtos (1)" });

        const input = screen.getByRole("searchbox", {
            name: "O que você procura?",
        });
        await user.clear(input);
        await user.type(input, "mel{Enter}");

        await screen.findByRole("heading", { name: "Resultados para “mel”" });
        const terms = searchCalls(fetchMock).map(([url]) =>
            new URL(String(url), "http://localhost").searchParams.get("busca"),
        );
        expect(terms).toEqual(["cafe", "mel"]);
    });

    it("CA05: clicar em um resultado abre a oferta ou o perfil do produtor", async () => {
        api();
        window.location.hash = "#/buscar?q=cafe";
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", { name: /Dona Maria/ }),
        );

        await waitFor(() => expect(window.location.hash).toBe("#/produtor/p1"));
    });

    it("CA05: o produto do resultado abre a página da oferta", async () => {
        api();
        window.location.hash = "#/buscar?q=cafe";
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", { name: /Café torrado/ }),
        );

        await waitFor(() => expect(window.location.hash).toBe("#/oferta/cafe"));
    });
});
