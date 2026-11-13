import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductDetailsPage } from "@/features/offers/ProductDetailsPage";
import type { ProductDetails } from "@/features/offers/productTypes";
import type { ComponentProps } from "react";

const mel: ProductDetails = {
    id: "mel",
    name: "Mel do Cerrado",
    producerName: "Dona Maria",
    price: 32,
    unit: "unidade",
    image: "https://exemplo.com/mel.jpg",
    available: true,
    description: "Mel produzido no território da Cafuringa.",
    measure: "500 g",
    whatsapp: "5561900000001",
};

function renderPage(
    props: Partial<ComponentProps<typeof ProductDetailsPage>> = {},
) {
    const onNavigate = vi.fn();
    const view = render(
        <ProductDetailsPage product={mel} onNavigate={onNavigate} {...props} />,
    );
    return { ...view, onNavigate };
}

afterEach(cleanup);

describe("ProductDetailsPage", () => {
    it("mostra o nome do produto como título, com a categoria (CA01)", () => {
        renderPage();

        expect(
            screen.getByRole("heading", { level: 1, name: "Mel do Cerrado" }),
        ).toBeDefined();
        expect(screen.getByText("Produtos")).toBeDefined();
    });

    it("mostra a imagem do produto", () => {
        renderPage();

        const image = screen.getByRole("img", { name: "Mel do Cerrado" });
        expect(image.getAttribute("src")).toBe("https://exemplo.com/mel.jpg");
    });

    it("mostra o preço cadastrado com a unidade (CA04)", () => {
        renderPage();

        expect(
            screen.getByRole("heading", { level: 2, name: "R$ 32 / unidade" }),
        ).toBeDefined();
    });

    it("identifica o produtor e a medida (CA03)", () => {
        renderPage();

        expect(screen.getByText("Produtor: Dona Maria")).toBeDefined();
        expect(screen.getByText("500 g por unidade")).toBeDefined();
    });

    it("omite a medida quando o produto não a informa", () => {
        renderPage({ product: { ...mel, measure: undefined } });

        expect(screen.getByText("Produtor: Dona Maria")).toBeDefined();
        expect(screen.queryByText(/por unidade/)).toBeNull();
    });

    it("mostra a descrição cadastrada pelo produtor (CA02)", () => {
        renderPage();

        expect(
            screen.getByRole("heading", { level: 2, name: "Descrição" }),
        ).toBeDefined();
        expect(
            screen.getByText("Mel produzido no território da Cafuringa."),
        ).toBeDefined();
    });

    it("usa um texto padrão quando não há descrição", () => {
        renderPage({ product: { ...mel, description: undefined } });

        expect(
            screen.getByText(
                "Consulte disponibilidade e formas de retirada diretamente com o produtor.",
            ),
        ).toBeDefined();
    });

    it("volta para o catálogo de produtos ao acionar Voltar", () => {
        const { onNavigate } = renderPage();

        fireEvent.click(screen.getByRole("button", { name: /voltar/i }));

        expect(onNavigate).toHaveBeenCalledWith("/produtos");
    });

    it("não exibe dados privados nem o número de WhatsApp como texto (CA05)", () => {
        const { container } = renderPage({
            product: {
                ...mel,
                cpf: "123.456.789-09",
                email: "dona.maria@exemplo.com",
            } as ProductDetails,
        });

        const text = container.textContent ?? "";
        expect(text).not.toContain("123.456.789-09");
        expect(text).not.toContain("dona.maria@exemplo.com");
        expect(text).not.toContain("5561900000001");
    });
});