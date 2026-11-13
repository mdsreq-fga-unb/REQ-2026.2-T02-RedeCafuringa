import { describe, expect, it } from "vitest";
import { toProductList } from "@/features/offers/productAdapter";
import type { ApiProduct } from "@/features/offers/productTypes";

const apiMel: ApiProduct = {
    id: "mel",
    nome: "Mel do Cerrado",
    produtor: "Dona Maria",
    preco: 32,
    unidade: "unidade",
    imagemUrl: "https://exemplo.com/mel.jpg",
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
                image: "https://exemplo.com/mel.jpg",
            },
        ]);
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
});
