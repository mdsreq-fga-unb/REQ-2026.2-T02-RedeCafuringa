import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";
import { listProducts } from "@/features/offers/productService";
import type { Product } from "@/features/offers/productTypes";

vi.mock("@/features/offers/productService");

const cesta: Product = {
    id: "cesta",
    name: "Cesta da estação",
    producerName: "Sítio Raízes",
    price: 40,
    unit: "cesta",
    image: "https://exemplo.com/cesta.jpg",
};

beforeEach(() => {
    vi.mocked(listProducts).mockResolvedValue([cesta]);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function renderDetails(id = "cesta") {
    const onNavigate = vi.fn();
    render(<ProductOfferDetails id={id} onNavigate={onNavigate} />);
    return { onNavigate };
}

describe("ProductOfferDetails", () => {
    it("mostra os detalhes do produto do catálogo", async () => {
        renderDetails();

        expect(
            await screen.findByRole("heading", { name: "Cesta da estação" }),
        ).toBeTruthy();
        expect(screen.getByText("R$ 40 / cesta")).toBeTruthy();
        expect(screen.getByText("Produtor: Sítio Raízes")).toBeTruthy();
    });

    it("não oferece contato pelo WhatsApp", async () => {
        renderDetails();
        await screen.findByRole("heading", { name: "Cesta da estação" });

        expect(
            screen.queryByRole("button", { name: "Conversar pelo WhatsApp" }),
        ).toBeNull();
    });

    it("volta para o catálogo de produtos", async () => {
        const { onNavigate } = renderDetails();
        await screen.findByRole("heading", { name: "Cesta da estação" });

        fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

        expect(onNavigate).toHaveBeenCalledWith("/produtos");
    });

    it("avisa enquanto carrega", () => {
        vi.mocked(listProducts).mockReturnValue(new Promise(() => {}));
        renderDetails();

        expect(screen.getByRole("status").textContent).toBe(
            "Carregando oferta...",
        );
    });

    it("avisa quando o produto não existe", async () => {
        renderDetails("inexistente");

        expect(await screen.findByText("Oferta não encontrada.")).toBeTruthy();
    });

    it("avisa quando o carregamento falha", async () => {
        vi.mocked(listProducts).mockRejectedValue(new Error("falhou"));
        renderDetails();

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Não foi possível carregar a oferta.",
        );
    });
});
