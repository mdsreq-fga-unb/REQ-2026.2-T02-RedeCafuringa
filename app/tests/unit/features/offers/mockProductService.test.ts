import { describe, expect, it } from "vitest";
import { mockApiProducts } from "@/features/offers/mockProducts";
import {
    getMockProductById,
    listMockProducts,
} from "@/features/offers/mockProductService";

describe("listMockProducts", () => {
    it("lista os produtos disponíveis do catálogo demo", async () => {
        const products = await listMockProducts();

        expect(products.map((product) => product.id)).toEqual(["mel", "cesta"]);
        expect(products[0]).toMatchObject({
            name: "Mel do Cerrado",
            producerName: "Dona Maria",
            price: 32,
            unit: "unidade",
        });
        expect(products[1]).toMatchObject({
            name: "Cesta da estação",
            producerName: "Sítio Raízes",
            price: 40,
            unit: "cesta",
        });
    });

    it("não expõe produtos indisponíveis (CA04)", async () => {
        const unavailable = mockApiProducts.filter(
            (product) => !product.disponivel,
        );
        expect(unavailable.length).toBeGreaterThan(0);

        const ids = (await listMockProducts()).map((product) => product.id);
        unavailable.forEach((product) => expect(ids).not.toContain(product.id));
    });
});

describe("getMockProductById", () => {
    it("devolve os detalhes de um produto disponível", async () => {
        const details = await getMockProductById("mel");

        expect(details).toMatchObject({
            id: "mel",
            name: "Mel do Cerrado",
            producerName: "Dona Maria",
            price: 32,
            unit: "unidade",
            available: true,
            measure: "500 g",
            description: expect.stringMatching(/\S/),
            whatsapp: expect.stringMatching(/^\d{12,13}$/),
        });
    });

    it("devolve produto indisponível com available false (CA06)", async () => {
        const unavailable = mockApiProducts.find(
            (product) => !product.disponivel,
        );
        if (!unavailable) throw new Error("demo sem produto indisponível");

        const details = await getMockProductById(unavailable.id);

        expect(details).not.toBeNull();
        expect(details?.available).toBe(false);
        expect(details?.name).toBe(unavailable.nome);
    });

    it("devolve null para id desconhecido (CA08)", async () => {
        await expect(getMockProductById("inexistente")).resolves.toBeNull();
    });

    it("os dados demo trazem descrição e apenas campos públicos (CA02, CA05)", () => {
        const publicFields = [
            "id",
            "nome",
            "produtor",
            "preco",
            "unidade",
            "imagemUrl",
            "disponivel",
            "descricao",
            "medida",
            "whatsapp",
        ];

        mockApiProducts.forEach((product) => {
            expect(product).toMatchObject({
                descricao: expect.stringMatching(/\S/),
            });
            Object.keys(product).forEach((key) =>
                expect(publicFields).toContain(key),
            );
        });
    });
});