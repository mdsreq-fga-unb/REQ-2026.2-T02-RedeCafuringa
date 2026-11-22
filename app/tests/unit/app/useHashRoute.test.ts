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

describe("useHashRoute — busca de ofertas (HU36)", () => {
    it("reconhece a rota de busca e preserva o termo", () => {
        window.location.hash = "#/buscar?q=caf%C3%A9";
        const { result } = renderHook(() => useHashRoute());

        expect(result.current.route).toBe("/buscar?q=caf%C3%A9");
    });
});

describe("useHashRoute: consulta de pré-reservas (HU45)", () => {
    it.each([
        "/reservas",
        "/reservas/b1",
        "/reservas/64b0c0ffee0000000000b001",
    ])("aceita a rota %s", (route) => {
        expect(routeFor(route)).toBe(route);
    });

    it("volta para /explorar na rota inválida /reservas/b1/extra", () => {
        expect(routeFor("/reservas/b1/extra")).toBe("/explorar");
    });
});

describe("useHashRoute: cancelamento de pré-reserva (HU46)", () => {
    it("aceita a rota /reservas/b1/cancelar", () => {
        expect(routeFor("/reservas/b1/cancelar")).toBe("/reservas/b1/cancelar");
    });

    it.each(["/reservas/b1/outra", "/reservas/b1/cancelar/extra"])(
        "volta para /explorar na rota inválida %s",
        (route) => {
            expect(routeFor(route)).toBe("/explorar");
        },
    );
});
