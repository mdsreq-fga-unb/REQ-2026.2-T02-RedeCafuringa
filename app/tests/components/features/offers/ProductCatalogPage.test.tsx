import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCatalogPage } from "@/features/offers/ProductCatalogPage";
import type { Product } from "@/features/offers/productTypes";
import type { ComponentProps } from "react";

function renderPage(
    props: Partial<ComponentProps<typeof ProductCatalogPage>> = {},
) {
    const onNavigate = vi.fn();
    const view = render(
        <ProductCatalogPage
            products={products}
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return { ...view, onNavigate };
}

afterEach(cleanup);

const products: Product[] = [
    {
        id: "mel",
        name: "Mel do Cerrado",
        producerName: "Dona Maria",
        price: 32,
        unit: "unidade",
        image: "https://exemplo.com/mel.jpg",
    },
    {
        id: "cesta",
        name: "Cesta da estação",
        producerName: "Sítio Raízes",
        price: 40,
        unit: "cesta",
        image: "https://exemplo.com/cesta.jpg",
    },
];

describe("ProductCatalogPage", () => {
    it.each([
        ["Mel do Cerrado", "/oferta/mel"],
        ["Cesta da estação", "/oferta/cesta"],
    ])("abre os detalhes de %s ao acionar o card (CA05)", (name, path) => {
        const { onNavigate } = renderPage();

        fireEvent.click(
            screen.getByRole("button", { name: new RegExp(name, "i") }),
        );

        expect(onNavigate).toHaveBeenCalledWith(path);
    });

    it("mostra o título do catálogo", () => {
        renderPage();

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Catálogo de Produtos",
            }),
        ).toBeDefined();
    });

    it("lista um card por produto com etiqueta, nome, produtor e preço", () => {
        renderPage();

        const cards = screen.getAllByRole("listitem");
        expect(cards).toHaveLength(2);

        const mel = within(cards[0]);
        expect(mel.getByText("Produto")).toBeDefined();
        expect(mel.getByText("Mel do Cerrado")).toBeDefined();
        expect(mel.getByText("Dona Maria")).toBeDefined();
        expect(mel.getByText("R$ 32 / unidade")).toBeDefined();
        expect(mel.getByText(/Conhecer/)).toBeDefined();

        const cesta = within(cards[1]);
        expect(cesta.getByText("Sítio Raízes")).toBeDefined();
        expect(cesta.getByText("R$ 40 / cesta")).toBeDefined();
    });

    it("mostra a imagem de cada produto", () => {
        const { container } = renderPage();

        const images = container.querySelectorAll("img");
        expect(images).toHaveLength(2);
        expect(images[0].getAttribute("src")).toBe(
            "https://exemplo.com/mel.jpg",
        );
    });

    it("volta para o perfil ao acionar Voltar", () => {
        const { onNavigate } = renderPage();

        fireEvent.click(screen.getByRole("button", { name: /voltar/i }));

        expect(onNavigate).toHaveBeenCalledWith("/perfil");
    });

    it("mostra mensagem de carregamento sem a lista", () => {
        renderPage({ status: "loading", products: [] });

        expect(screen.getByRole("status").textContent).toBe(
            "Carregando produtos...",
        );
        expect(screen.queryByRole("list")).toBeNull();
    });

    it("avisa quando não há produtos disponíveis (CA06)", () => {
        renderPage({ products: [] });

        expect(
            screen.getByText("Não há ofertas disponíveis no momento."),
        ).toBeDefined();
        expect(screen.queryByRole("list")).toBeNull();
    });

    it("avisa quando o carregamento falha (CA08)", () => {
        renderPage({ status: "error", products: [] });

        expect(screen.getByRole("alert").textContent).toContain(
            "Não foi possível carregar os produtos.",
        );
        expect(screen.queryByRole("list")).toBeNull();
    });

    it("permite tentar carregar novamente", () => {
        const onRetry = vi.fn();
        renderPage({ status: "error", products: [], onRetry });

        fireEvent.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("mostra o campo de busca quando há produtos", () => {
        renderPage();

        expect(
            screen.getByRole("searchbox", { name: "Buscar produtos" }),
        ).toBeDefined();
    });

    it("filtra os cards conforme o texto digitado", () => {
        renderPage();

        fireEvent.change(
            screen.getByRole("searchbox", { name: "Buscar produtos" }),
            { target: { value: "mel" } },
        );

        const cards = screen.getAllByRole("listitem");
        expect(cards).toHaveLength(1);
        expect(within(cards[0]).getByText("Mel do Cerrado")).toBeDefined();
    });

    it("avisa quando a busca não encontra produtos", () => {
        renderPage();

        fireEvent.change(
            screen.getByRole("searchbox", { name: "Buscar produtos" }),
            { target: { value: "queijo" } },
        );

        expect(screen.getByText("Nenhum produto encontrado.")).toBeDefined();
        expect(screen.queryByRole("list")).toBeNull();
    });

    it("não mostra a busca sem produtos para filtrar", () => {
        renderPage({ products: [] });

        expect(screen.queryByRole("searchbox")).toBeNull();
    });

    it("não mostra a busca quando o carregamento falha", () => {
        renderPage({ status: "error", products: [] });

        expect(screen.queryByRole("searchbox")).toBeNull();
    });
});
