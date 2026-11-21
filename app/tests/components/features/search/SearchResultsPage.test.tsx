import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiHttpError } from "@/shared/api";
import { SearchResultsPage } from "@/features/search/SearchResultsPage";
import type { SearchResults } from "@/features/search/searchService";

const maria = {
    id: "p1",
    nomeIniciativa: "Dona Maria",
    categoriaOfertada: "Produtos" as const,
    trajetoria: "Plantamos café há 20 anos.",
};
const cafe = {
    id: "cafe",
    name: "Café torrado",
    category: "Produtos",
    producerName: "Sítio Raízes",
    price: 32,
    unit: "unidade",
    image: "",
};
const trilha = {
    id: "trilha",
    name: "Trilha do café",
    category: "Experiências",
    producerName: "Sítio Raízes",
    price: 45,
    unit: "pessoa",
    image: "",
};

function results(overrides: Partial<SearchResults> = {}): SearchResults {
    return {
        termo: "cafe",
        produtores: { itens: [maria], total: 1 },
        produtos: { itens: [cafe], total: 1 },
        experiencias: { itens: [trilha], total: 1 },
        ...overrides,
    };
}

const empty = { itens: [], total: 0 };

function renderPage(
    props: Partial<Parameters<typeof SearchResultsPage>[0]> = {},
) {
    const search = vi.fn().mockResolvedValue(results());
    const onNavigate = vi.fn();
    const view = render(
        <SearchResultsPage
            search={search}
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return { ...view, search, onNavigate };
}

const field = () =>
    screen.getByRole("searchbox", { name: "O que você procura?" });

afterEach(cleanup);

describe("HU36 — tela de resultados da busca", () => {
    describe("CA01, CA02: acessar a busca e informar o termo", () => {
        it("oferece o campo de busca e o botão, sem buscar nada ainda", () => {
            const { search } = renderPage();

            expect(
                screen.getByRole("heading", {
                    level: 1,
                    name: "Buscar ofertas",
                }),
            ).toBeTruthy();
            expect(screen.getByRole("search")).toBeTruthy();
            expect((field() as HTMLInputElement).value).toBe("");
            expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy();
            expect(search).not.toHaveBeenCalled();
        });

        it("usa o termo produtoras, como o restante do app, no texto de ajuda", () => {
            renderPage();

            expect(field().getAttribute("placeholder")).toBe(
                "Produtos, experiências ou produtoras",
            );
        });

        it("com termo inicial, preenche o campo e busca sozinha", async () => {
            const { search } = renderPage({ initialTerm: "cafe" });

            expect((field() as HTMLInputElement).value).toBe("cafe");
            expect(screen.getByRole("status").textContent).toMatch(/Buscando/);
            await screen.findByRole("heading", { name: /Resultados para/ });
            expect(search).toHaveBeenCalledTimes(1);
            expect(search.mock.calls[0][0]).toBe("cafe");
        });

        it("buscar pelo botão ou pelo Enter envia o termo digitado", async () => {
            const user = userEvent.setup();
            const { search } = renderPage();

            await user.type(field(), "  queijo   minas ");
            await user.click(screen.getByRole("button", { name: "Buscar" }));
            await screen.findByRole("heading", { name: /Resultados para/ });
            expect(search.mock.calls[0][0]).toBe("queijo minas");

            await user.type(field(), "{Enter}");
            await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
        });
    });

    describe("CA03, CA04: resultados organizados por tipo", () => {
        it("mostra o termo e um grupo para cada tipo, com a contagem", async () => {
            renderPage({ initialTerm: "cafe" });

            await screen.findByRole("heading", {
                level: 2,
                name: "Resultados para “cafe”",
            });
            expect(
                screen.getByRole("heading", { name: "Produtoras (1)" }),
            ).toBeTruthy();
            expect(
                screen.getByRole("heading", { name: "Produtos (1)" }),
            ).toBeTruthy();
            expect(
                screen.getByRole("heading", { name: "Experiências (1)" }),
            ).toBeTruthy();
            expect(
                screen.getByRole("button", { name: /Dona Maria/ }),
            ).toBeTruthy();
            expect(
                screen.getByRole("button", { name: /Café torrado/ }),
            ).toBeTruthy();
            expect(
                screen.getByRole("button", { name: /Trilha do café/ }),
            ).toBeTruthy();
        });

        it("não mostra o grupo que ficou vazio", async () => {
            renderPage({
                initialTerm: "cafe",
                search: vi
                    .fn()
                    .mockResolvedValue(
                        results({ produtores: empty, experiencias: empty }),
                    ),
            });

            await screen.findByRole("heading", { name: "Produtos (1)" });
            expect(
                screen.queryByRole("heading", { name: /Produtoras/ }),
            ).toBeNull();
            expect(
                screen.queryByRole("heading", { name: /Experiências/ }),
            ).toBeNull();
        });

        it("informa quando há mais resultados do que os mostrados", async () => {
            renderPage({
                initialTerm: "cafe",
                search: vi.fn().mockResolvedValue(
                    results({
                        produtos: { itens: [cafe], total: 5 },
                    }),
                ),
            });

            await screen.findByRole("heading", { name: "Produtos (5)" });
            expect(screen.getByText("Mostrando 1 de 5")).toBeTruthy();
        });
    });

    describe("CA05: acessar os detalhes de um resultado", () => {
        it("produto abre a página da oferta", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({ initialTerm: "cafe" });

            await user.click(
                await screen.findByRole("button", { name: /Café torrado/ }),
            );

            expect(onNavigate).toHaveBeenCalledWith("/oferta/cafe");
        });

        it("experiência abre a página da oferta como experiência", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({ initialTerm: "cafe" });

            await user.click(
                await screen.findByRole("button", { name: /Trilha do café/ }),
            );

            expect(onNavigate).toHaveBeenCalledWith(
                "/oferta/trilha?tipo=experiencia",
            );
        });

        it("produtor abre o perfil público", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({ initialTerm: "cafe" });

            await user.click(
                await screen.findByRole("button", { name: /Dona Maria/ }),
            );

            expect(onNavigate).toHaveBeenCalledWith("/produtor/p1");
        });
    });

    describe("CA06: busca sem resultados", () => {
        it("avisa que nada foi encontrado e sugere outro termo", async () => {
            renderPage({
                initialTerm: "xyzzy",
                search: vi.fn().mockResolvedValue(
                    results({
                        termo: "xyzzy",
                        produtores: empty,
                        produtos: empty,
                        experiencias: empty,
                    }),
                ),
            });

            const status = await screen.findByText(
                /Nenhum resultado encontrado para “xyzzy”/,
            );
            expect(status.closest("[role=status]")).toBeTruthy();
            expect(screen.getByText(/Tente outras palavras/)).toBeTruthy();
            expect(
                screen.queryByRole("heading", { name: /Produtos/ }),
            ).toBeNull();
            expect((field() as HTMLInputElement).value).toBe("xyzzy");
        });
    });

    describe("CA07: nova busca", () => {
        it("troca o termo e substitui os resultados anteriores", async () => {
            const user = userEvent.setup();
            const search = vi
                .fn()
                .mockResolvedValueOnce(results())
                .mockResolvedValueOnce(
                    results({
                        termo: "mel",
                        produtores: empty,
                        experiencias: empty,
                        produtos: {
                            itens: [
                                { ...cafe, id: "mel", name: "Mel do Cerrado" },
                            ],
                            total: 1,
                        },
                    }),
                );
            renderPage({ initialTerm: "cafe", search });
            await screen.findByRole("button", { name: /Café torrado/ });

            await user.clear(field());
            await user.type(field(), "mel{Enter}");

            await screen.findByRole("heading", {
                name: "Resultados para “mel”",
            });
            expect(search.mock.calls[1][0]).toBe("mel");
            expect(
                screen.getByRole("button", { name: /Mel do Cerrado/ }),
            ).toBeTruthy();
            expect(
                screen.queryByRole("button", { name: /Café torrado/ }),
            ).toBeNull();
        });

        it("uma resposta antiga não sobrescreve a busca mais recente", async () => {
            const user = userEvent.setup();
            let releaseFirst: (value: SearchResults) => void = () => {};
            const search = vi
                .fn()
                .mockReturnValueOnce(
                    new Promise<SearchResults>((resolve) => {
                        releaseFirst = resolve;
                    }),
                )
                .mockResolvedValueOnce(
                    results({
                        termo: "mel",
                        produtores: empty,
                        experiencias: empty,
                        produtos: {
                            itens: [
                                { ...cafe, id: "mel", name: "Mel do Cerrado" },
                            ],
                            total: 1,
                        },
                    }),
                );
            renderPage({ initialTerm: "cafe", search });

            await user.clear(field());
            await user.type(field(), "mel{Enter}");
            await screen.findByRole("button", { name: /Mel do Cerrado/ });
            releaseFirst(results());

            await waitFor(() =>
                expect(
                    screen.queryByRole("button", { name: /Café torrado/ }),
                ).toBeNull(),
            );
            expect(
                screen.getByRole("button", { name: /Mel do Cerrado/ }),
            ).toBeTruthy();
        });
    });

    describe("CA08: entrada inválida", () => {
        it("explica como corrigir, mantém o texto digitado e não busca", async () => {
            const user = userEvent.setup();
            const { search } = renderPage();

            await user.type(field(), "a{Enter}");

            const alert = screen.getByRole("alert");
            expect(alert.textContent).toBe(
                "Digite pelo menos 2 caracteres para buscar.",
            );
            expect(field().getAttribute("aria-invalid")).toBe("true");
            expect(field().getAttribute("aria-describedby")).toBe(alert.id);
            expect((field() as HTMLInputElement).value).toBe("a");
            expect(search).not.toHaveBeenCalled();
        });

        it.each([
            ["", "Informe o que você quer buscar."],
            ["%%%", /Use apenas letras, números e pontuação simples/],
            ["a".repeat(101), "A busca deve ter no máximo 100 caracteres."],
        ])("recusa %j com a orientação certa", async (valor, message) => {
            const user = userEvent.setup();
            const { search } = renderPage();

            if (valor) await user.type(field(), valor);
            await user.click(screen.getByRole("button", { name: "Buscar" }));

            expect(screen.getByRole("alert").textContent).toMatch(message);
            expect(search).not.toHaveBeenCalled();
        });

        it("termo inicial inválido mostra a orientação sem buscar", () => {
            const { search } = renderPage({ initialTerm: "%%%" });

            expect(screen.getByRole("alert").textContent).toMatch(
                /pontuação simples/,
            );
            expect(search).not.toHaveBeenCalled();
        });

        it("corrigir o termo limpa o erro e busca", async () => {
            const user = userEvent.setup();
            const { search } = renderPage();
            await user.type(field(), "a{Enter}");
            expect(screen.getByRole("alert")).toBeTruthy();

            await user.type(field(), "b{Enter}");

            await screen.findByRole("heading", { name: /Resultados para/ });
            expect(screen.queryByRole("alert")).toBeNull();
            expect(field().getAttribute("aria-invalid")).not.toBe("true");
            expect(search.mock.calls[0][0]).toBe("ab");
        });

        it("mostra a orientação devolvida pelo servidor (400)", async () => {
            const user = userEvent.setup();
            const search = vi.fn().mockRejectedValue(
                new ApiHttpError({
                    status: 400,
                    message: "Bad Request",
                    details: ["A busca deve ter no máximo 100 caracteres."],
                }),
            );
            renderPage({ search });

            await user.type(field(), "termo{Enter}");

            expect((await screen.findByRole("alert")).textContent).toBe(
                "A busca deve ter no máximo 100 caracteres.",
            );
            expect((field() as HTMLInputElement).value).toBe("termo");
        });
    });

    describe("falha ao buscar", () => {
        it("avisa, mantém o termo e permite tentar de novo", async () => {
            const user = userEvent.setup();
            const search = vi
                .fn()
                .mockRejectedValueOnce(new Error("rede"))
                .mockResolvedValueOnce(results());
            renderPage({ initialTerm: "cafe", search });

            const alert = await screen.findByRole("alert");
            expect(alert.textContent).toMatch(
                /Não foi possível realizar a busca/,
            );
            expect((field() as HTMLInputElement).value).toBe("cafe");

            await user.click(
                screen.getByRole("button", { name: "Tentar novamente" }),
            );

            await screen.findByRole("heading", { name: "Produtos (1)" });
            expect(search).toHaveBeenCalledTimes(2);
            expect(screen.queryByRole("alert")).toBeNull();
        });
    });

    describe("RNF04: acessibilidade", () => {
        it.each([
            ["inicial", {}],
            ["com resultados", { initialTerm: "cafe" }],
            ["com erro de validação", { initialTerm: "a" }],
        ])("sem violações WCAG A/AA: %s", async (_caso, props) => {
            const { container } = renderPage(props);
            if ("initialTerm" in props && props.initialTerm === "cafe")
                await screen.findByRole("heading", { name: "Produtos (1)" });

            const report = await axe.run(container, {
                runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                rules: { "color-contrast": { enabled: false } },
            });

            expect(report.violations).toEqual([]);
        });
    });
});
