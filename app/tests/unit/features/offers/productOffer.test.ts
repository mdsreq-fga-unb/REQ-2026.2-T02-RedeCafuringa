import { describe, expect, it } from "vitest";
import { productToOffer } from "@/features/offers/productOffer";
import type { Product } from "@/features/offers/productTypes";

const cesta: Product = {
    id: "cesta",
    name: "Cesta da estação",
    producerName: "Sítio Raízes",
    price: 40,
    unit: "cesta",
    image: "https://exemplo.com/cesta.jpg",
};

describe("productToOffer", () => {
    it("converte o produto em uma oferta para a página de detalhes", () => {
        expect(productToOffer(cesta)).toMatchObject({
            id: "cesta",
            title: "Cesta da estação",
            category: "Produtos",
            image: "https://exemplo.com/cesta.jpg",
            price: "R$ 40 / cesta",
        });
    });

    it("informa o produtor e orienta o contato com ele", () => {
        const offer = productToOffer(cesta);

        expect(offer.details).toContain("Produtor: Sítio Raízes");
        expect(offer.description).toMatch(/produtor/i);
    });
});
