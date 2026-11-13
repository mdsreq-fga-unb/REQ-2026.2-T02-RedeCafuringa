import { describe, expect, it } from "vitest";
import { filterProducts } from "@/features/offers/productSearch";
import type { Product } from "@/features/offers/productTypes";

const mel: Product = {
    id: "mel",
    name: "Mel do Cerrado",
    producerName: "Dona Maria",
    price: 32,
    unit: "unidade",
    image: "https://exemplo.com/mel.jpg",
};
const cesta: Product = {
    id: "cesta",
    name: "Cesta da estação",
    producerName: "Sítio Raízes",
    price: 40,
    unit: "cesta",
    image: "https://exemplo.com/cesta.jpg",
};
const products = [mel, cesta];

describe("filterProducts", () => {
    it("devolve todos quando a busca está vazia", () => {
        expect(filterProducts(products, "")).toEqual(products);
        expect(filterProducts(products, "   ")).toEqual(products);
    });

    it("encontra pelo nome sem diferenciar maiúsculas", () => {
        expect(filterProducts(products, "MEL")).toEqual([mel]);
    });

    it("encontra pelo nome do produtor", () => {
        expect(filterProducts(products, "raízes")).toEqual([cesta]);
    });

    it("ignora acentos", () => {
        expect(filterProducts(products, "estacao")).toEqual([cesta]);
        expect(filterProducts(products, "sitio raizes")).toEqual([cesta]);
    });

    it("devolve lista vazia quando nada combina", () => {
        expect(filterProducts(products, "queijo")).toEqual([]);
    });
});
