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

    it("manda rotas desconhecidas para a escolha de perfil", () => {
        window.location.hash = "#/nao-existe";
        const { result } = renderHook(() => useHashRoute());

        expect(result.current.route).toBe("/escolher-perfil");
    });
});