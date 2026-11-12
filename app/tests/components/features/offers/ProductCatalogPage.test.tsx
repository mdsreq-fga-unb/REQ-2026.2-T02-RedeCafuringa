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

function renderPage() {
    const onNavigate = vi.fn();
    const view = render(
        <ProductCatalogPage products={products} onNavigate={onNavigate} />,
    );
    return { ...view, onNavigate };
}

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
});