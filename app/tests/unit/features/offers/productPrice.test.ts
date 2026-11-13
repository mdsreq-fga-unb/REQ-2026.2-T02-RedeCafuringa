import { describe, expect, it } from "vitest";
import { formatProductPrice } from "@/features/offers/productPrice";

describe("formatProductPrice", () => {
    it("mostra valor inteiro sem centavos", () => {
        expect(formatProductPrice(32, "unidade")).toBe("R$ 32 / unidade");
    });

    it("mostra centavos com vírgula e duas casas", () => {
        expect(formatProductPrice(32.5, "unidade")).toBe("R$ 32,50 / unidade");
    });

    it("usa a unidade informada", () => {
        expect(formatProductPrice(40, "cesta")).toBe("R$ 40 / cesta");
    });
});
