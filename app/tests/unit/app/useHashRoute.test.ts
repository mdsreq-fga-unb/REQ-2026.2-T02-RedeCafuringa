import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useHashRoute } from "@/app/useHashRoute";

afterEach(() => {
    cleanup();
    window.location.hash = "";
});

const routeFor = (route: string) => {
    window.location.hash = `#${route}`;
    return renderHook(() => useHashRoute()).result.current.route;
};

describe("useHashRoute: rotas da pré-reserva (HU44)", () => {
    it.each(["/pre-reserva/e1", "/pre-reserva/e1?x=1", "/pre-reserva-enviada"])(
        "aceita a rota %s",
        (route) => {
            expect(routeFor(route)).toBe(route);
        },
    );

    it.each(["/pre-reserva", "/pre-reserva/e1/extra"])(
        "volta para /explorar na rota inválida %s",
        (route) => {
            expect(routeFor(route)).toBe("/explorar");
        },
    );
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
