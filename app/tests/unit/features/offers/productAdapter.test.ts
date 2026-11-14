import { describe, expect, it } from "vitest";
import { apiResourceUrl } from "@/shared/api";
import { toProductList } from "@/features/offers/productAdapter";
import type { ApiProduct } from "@/features/offers/productTypes";

const apiMel: ApiProduct = {
    id: "mel",
    nome: "Mel do Cerrado",
    categoria: "Produtos",
    descricao: "Mel produzido no território da Cafuringa.",
    precoPorUnidade: 32,
    gramasPorUnidade: 500,
    fotos: [
        "/products/mel/photos/f001?v=abc",
        "/products/mel/photos/f002?v=def",
    ],
    produtor: { id: "p1", nomeIniciativa: "Dona Maria" },
    criadoEm: "2026-11-13T12:00:00.000Z",
    disponivel: true,
};

describe("toProductList", () => {
    it("converte os campos da API para o modelo do front", () => {
        expect(toProductList([apiMel])).toEqual([
            {
                id: "mel",
                name: "Mel do Cerrado",
                producerName: "Dona Maria",
                price: 32,
                unit: "unidade",
                image: apiResourceUrl(apiMel.fotos[0]),
            },
        ]);
    });

    it("usa a primeira foto como capa", () => {
        const [product] = toProductList([apiMel]);

        expect(product.image).toBe(apiResourceUrl("/products/mel/photos/f001?v=abc"));
        expect(product.image).not.toBe(
            apiResourceUrl("/products/mel/photos/f002?v=def"),
        );
    });

    it("preserva preços com centavos", () => {
        const [product] = toProductList([{ ...apiMel, precoPorUnidade: 12.5 }]);

        expect(product.price).toBe(12.5);
    });

    it("descarta produtos indisponíveis (RN10)", () => {
        const retirado: ApiProduct = {
            ...apiMel,
            id: "retirado",
            disponivel: false,
        };
        const result = toProductList([apiMel, retirado]);
        expect(result.map((product) => product.id)).toEqual(["mel"]);
    });

    it("devolve lista vazia quando não há produtos", () => {
        expect(toProductList([])).toEqual([]);
    });

        it("permite trocar como a URL da foto é resolvida", () => {
        const [product] = toProductList([apiMel], (foto) => `demo:${foto}`);

        expect(product.image).toBe("demo:/products/mel/photos/f001?v=abc");
    });
});