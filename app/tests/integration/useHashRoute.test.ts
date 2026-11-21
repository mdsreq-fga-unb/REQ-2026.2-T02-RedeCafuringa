import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useHashRoute } from "@/app/useHashRoute";

afterEach(() => {
    cleanup();
    window.location.hash = "";
});

describe("useHashRoute", () => {
    it("reconhece a rota pública do catálogo de produtos", () => {
        window.location.hash = "#/produtos";
        const { result } = renderHook(() => useHashRoute());

        expect(result.current.route).toBe("/produtos");
    });

    it("reconhece a rota de cadastro de experiência", () => {
        window.location.hash = "#/experiencias/nova";
        const { result } = renderHook(() => useHashRoute());

        expect(result.current.route).toBe("/experiencias/nova");
    });

    it("manda rotas desconhecidas para Explorar", () => {
        window.location.hash = "#/nao-existe";
        const { result } = renderHook(() => useHashRoute());

        expect(result.current.route).toBe("/explorar");
    });
});

describe("useHashRoute — busca de ofertas (HU36)", () => {
    it("reconhece a rota de busca e preserva o termo", () => {
        window.location.hash = "#/buscar?q=caf%C3%A9";
        const { result } = renderHook(() => useHashRoute());

        expect(result.current.route).toBe("/buscar?q=caf%C3%A9");
    });
});
