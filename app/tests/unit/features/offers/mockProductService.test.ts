import { describe, expect, it } from "vitest";
import { mockApiProducts } from "@/features/offers/mockProducts";
import { listMockProducts } from "@/features/offers/mockProductService";


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
            unit: "unidade",
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

        it("mantém as URLs completas das fotos do demo", async () => {
        const [mel] = await listMockProducts();

        expect(mel.image).toBe(mockApiProducts[0].fotos[0]);
    });
});
