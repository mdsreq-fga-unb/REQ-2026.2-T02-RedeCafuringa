import { describe, expect, it, vi } from "vitest";
import { searchOffers } from "@/features/search/searchService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

describe("HU36 — searchOffers (demonstração)", () => {
    it("encontra produtos, sem diferenciar acentos e maiúsculas", async () => {
        const result = await searchOffers("ESTACAO");

        expect(result.termo).toBe("ESTACAO");
        expect(result.produtos.itens.map((item) => item.id)).toEqual(["cesta"]);
        expect(result.produtos.total).toBe(1);
    });

    it("encontra pelo nome do produtor nas três listas", async () => {
        const result = await searchOffers("dona maria");

        expect(result.produtores.itens.map((item) => item.id)).toContain(
            "demo-dona-maria",
        );
        expect(result.produtos.itens.map((item) => item.id)).toContain("mel");
    });

    it("encontra experiências da demonstração", async () => {
        const result = await searchOffers("degustacao");

        expect(result.experiencias.total).toBeGreaterThan(0);
        expect(result.experiencias.itens[0].name).toMatch(/Degustação/);
    });

    it("CA06: sem correspondência, devolve os três grupos vazios", async () => {
        await expect(searchOffers("xyzzy")).resolves.toEqual({
            termo: "xyzzy",
            produtores: { itens: [], total: 0 },
            produtos: { itens: [], total: 0 },
            experiencias: { itens: [], total: 0 },
        });
    });

    it("usa o termo normalizado, sem espaços sobrando", async () => {
        const result = await searchOffers("  cesta   da estação ");

        expect(result.termo).toBe("cesta da estação");
        expect(result.produtos.total).toBe(1);
    });
});
