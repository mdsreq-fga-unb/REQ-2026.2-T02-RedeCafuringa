import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { offers } from "@/features/offers/offerData";
import {
    json,
    mockTrajectoryApi,
    producerId,
    publicRoute,
    publicTrajectory,
    seedSession,
} from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

function api({
    directory = () => json([publicTrajectory]),
    catalog = () => json([]),
    phone,
}: {
    directory?: () => Response;
    catalog?: () => Response;
    phone?: string;
} = {}) {
    const detail = mockTrajectoryApi({
        publicData: { ...publicTrajectory, telefone: phone },
    });
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input), "http://localhost").pathname;
        if (path === "/api/v1/producers") return Promise.resolve(directory());
        if (path === `/api/v1/producers/${producerId}/offers`)
            return Promise.resolve(catalog());
        return detail(input, init);
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}
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

describe("HU14 — Explorar", () => {
    it("busca e filtra os produtores cadastrados sem alterar seus perfis", async () => {
        const fetchMock = api({
            directory: () =>
                json([
                    publicTrajectory,
                    {
                        ...publicTrajectory,
                        id: "outro",
                        nomeIniciativa: "Guia Francisco",
                        categoriaOfertada: "Experiências",
                    },
                ]),
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("button", { name: /Horta da Maria/ });
        expect(
            screen
                .getByRole("button", { name: /Produtos Alimentos/ })
                .getAttribute("aria-pressed"),
        ).toBe("true");
        await user.click(
            screen.getByRole("button", { name: /Experiências Viva/ }),
        );
        expect(
            screen
                .getByRole("button", { name: /Produtos Alimentos/ })
                .getAttribute("aria-pressed"),
        ).toBe("false");
        expect(
            screen
                .getByRole("button", { name: /Experiências Viva/ })
                .getAttribute("aria-pressed"),
        ).toBe("true");
        await user.type(screen.getByRole("searchbox"), "francisco");
        expect(
            screen.getByRole("button", { name: /Guia Francisco/ }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: /Horta da Maria/ }),
        ).toBeNull();
        await user.clear(screen.getByRole("searchbox"));
        await user.click(
            screen.getByRole("button", { name: /Produtos Alimentos/ }),
        );
        expect(
            screen.getByRole("button", { name: /Horta da Maria/ }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: /Guia Francisco/ }),
        ).toBeNull();
        expect(
            screen
                .getByRole("button", { name: /Experiências Viva/ })
                .getAttribute("aria-pressed"),
        ).toBe("false");
        // Selecionar novamente mantém uma opção ativa; não limpa a seleção.
        await user.click(
            screen.getByRole("button", { name: /Produtos Alimentos/ }),
        );
        expect(
            screen
                .getByRole("button", { name: /Produtos Alimentos/ })
                .getAttribute("aria-pressed"),
        ).toBe("true");
        await user.click(
            screen.getByRole("button", { name: /Horta da Maria/ }),
        );
        await screen.findByRole("heading", { name: "Horta da Maria" });
        expect(window.location.hash).toBe(publicRoute);
        const directoryCall = fetchMock.mock.calls.find(([input]) =>
            String(input).endsWith("/producers"),
        );
        expect(
            new Headers(directoryCall?.[1]?.headers).has("Authorization"),
        ).toBe(false);
    });

    it("Ver tudo expande a lista e Ver menos volta aos destaques", async () => {
        api({
            directory: () =>
                json([
                    publicTrajectory,
                    { ...publicTrajectory, id: "2", nomeIniciativa: "Segundo" },
                    {
                        ...publicTrajectory,
                        id: "3",
                        nomeIniciativa: "Terceiro",
                    },
                ]),
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("button", { name: /Segundo/ });
        expect(screen.queryByRole("button", { name: /Terceiro/ })).toBeNull();
        await user.click(screen.getByRole("button", { name: /Ver tudo/ }));
        expect(screen.getByRole("button", { name: /Terceiro/ })).toBeTruthy();
        await user.click(screen.getByRole("button", { name: /Ver menos/ }));
        expect(screen.queryByRole("button", { name: /Terceiro/ })).toBeNull();
    });

    it("lista vazia não apresenta produtores fictícios", async () => {
        api({ directory: () => json([]) });
        render(<App />);
        expect(
            await screen.findByText(/ainda não há produtores/i),
        ).toBeTruthy();
        expect(screen.queryByText("Dona Cida")).toBeNull();
    });

    it("erro de listagem pode ser recuperado sem recarregar a página", async () => {
        let attempt = 0;
        api({
            directory: () =>
                ++attempt === 1
                    ? json({ message: "Falha" }, 503)
                    : json([publicTrajectory]),
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("alert");
        await user.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );
        expect(
            await screen.findByRole("button", { name: /Horta da Maria/ }),
        ).toBeTruthy();
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("resposta inválida é tratada como erro de consulta", async () => {
        api({ directory: () => json({ unexpected: true }) });
        render(<App />);
        expect((await screen.findByRole("alert")).textContent).toMatch(
            /não foi possível carregar/i,
        );
    });

    it("controles e cards do Explorar passam pela análise automática WCAG A/AA", async () => {
        api();
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            null,
        );
        const { container } = render(<App />);
        await screen.findByRole("button", { name: /Horta da Maria/ });
        const result = await axe.run(container, {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
            rules: { "color-contrast": { enabled: false } },
        });
        expect(result.violations.map(({ id }) => id)).toEqual([]);
    });
});

describe("HU14 — ofertas e contato vinculados ao produtor", () => {
    it("exibe somente as ofertas associadas ao produtor e preserva o retorno do detalhe", async () => {
        api({
            catalog: () =>
                json([
                    { ...offers[1], producerId },
                    { ...offers[0], producerId: "outro" },
                ]),
        });
        window.location.hash = `${publicRoute}?catalogo=1`;
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("button", { name: /Mel do Cerrado/ });
        expect(
            screen.queryByRole("button", { name: /Visita e Degustação/ }),
        ).toBeNull();
        await user.click(
            screen.getByRole("button", { name: /Mel do Cerrado/ }),
        );
        expect(
            await screen.findByRole("heading", { name: "Mel do Cerrado" }),
        ).toBeTruthy();
        expect(window.location.hash).toContain(producerId);
        await user.click(screen.getByRole("button", { name: "Voltar" }));
        expect(
            await screen.findByRole("heading", { name: "Catálogo do perfil" }),
        ).toBeTruthy();
        expect(screen.getByText("Horta da Maria")).toBeTruthy();
    });

    it("distingue catálogo vazio de falha na consulta", async () => {
        api();
        window.location.hash = `${publicRoute}?catalogo=1`;
        render(<App />);
        expect(await screen.findByText(/ainda não tem ofertas/i)).toBeTruthy();
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("recupera erro nas ofertas sem perder o produtor", async () => {
        let attempt = 0;
        api({
            catalog: () =>
                ++attempt === 1
                    ? json({ message: "Falha" }, 503)
                    : json([{ ...offers[1], producerId }]),
        });
        window.location.hash = `${publicRoute}?catalogo=1`;
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("alert");
        await user.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );
        expect(
            await screen.findByRole("button", { name: /Mel do Cerrado/ }),
        ).toBeTruthy();
        expect(screen.getByText("Horta da Maria")).toBeTruthy();
    });

    it("consumidor usa o telefone público selecionado, sem usar o contato local de outra conta", async () => {
        seedSession("consumer");
        localStorage.setItem(
            "cafuringa-contact",
            JSON.stringify({
                whatsappNumber: "5561999999999",
                authorized: true,
            }),
        );
        api({ phone: "61988887777" });
        window.location.hash = publicRoute;
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        const user = userEvent.setup();
        render(<App />);
        await user.click(
            await screen.findByRole("button", {
                name: "Conversar pelo WhatsApp",
            }),
        );
        expect(open).toHaveBeenCalledOnce();
        const url = new URL(String(open.mock.calls[0][0]));
        expect(url.pathname).toBe("/5561988887777");
        expect(url.searchParams.get("text")).toContain("Horta da Maria");
        expect(open.mock.calls[0].slice(1)).toEqual([
            "_blank",
            "noopener,noreferrer",
        ]);
    });

    it("visitante consulta o perfil livremente e entra apenas ao iniciar contato", async () => {
        api({ phone: "61988887777" });
        window.location.hash = publicRoute;
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        const user = userEvent.setup();
        render(<App />);
        await user.click(
            await screen.findByRole("button", {
                name: "Conversar pelo WhatsApp",
            }),
        );
        await waitFor(() =>
            expect(window.location.hash).toBe(
                `#/entrar?contato=${encodeURIComponent(`produtor/${producerId}`)}`,
            ),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Entre para falar com o responsável",
            }),
        ).toBeTruthy();
        expect(open).not.toHaveBeenCalled();
    });
});
