import { describe, expect, it } from "vitest";
import {
    bookingAccess,
    bookingLoginRoute,
    bookingReturnRoute,
    bookingRoute,
    canRequestBooking,
    experienceDetailsRoute,
    parseBookingRoute,
} from "@/features/bookings/bookingRoutes";

describe("bookingRoute", () => {
    it("monta a rota da pré-reserva de uma experiência", () => {
        expect(bookingRoute("e1")).toBe("/pre-reserva/e1");
    });

    it("codifica caracteres especiais do id", () => {
        expect(bookingRoute("a b/c")).toBe("/pre-reserva/a%20b%2Fc");
    });
});

describe("parseBookingRoute", () => {
    it("extrai o id da experiência da rota", () => {
        expect(parseBookingRoute("/pre-reserva/64b0c0ffee0000000000e001")).toBe(
            "64b0c0ffee0000000000e001",
        );
    });

    it("ignora a query string", () => {
        expect(parseBookingRoute("/pre-reserva/e1?x=1")).toBe("e1");
    });

    it("decodifica o id", () => {
        expect(parseBookingRoute(bookingRoute("a b/c"))).toBe("a b/c");
    });

    it.each([
        "/pre-reserva",
        "/pre-reserva/",
        "/pre-reserva/e1/extra",
        "/oferta/e1",
        "/pre-reserva-enviada",
        "/pre-reserva/%E0%A4%A",
    ])("devolve null para %s", (route) => {
        expect(parseBookingRoute(route)).toBeNull();
    });
});

describe("bookingAccess (HU44 CA02, RNF08)", () => {
    it.each([
        [null, false, false, "login"],
        [null, true, true, "login"],
        ["consumer", true, false, "allowed"],
        ["consumer", false, false, "login"],
        ["consumer", false, true, "allowed"],
        ["producer", true, false, "blocked"],
        ["admin", true, true, "blocked"],
    ] as const)(
        "perfil %s, token %s, demonstração %s → %s",
        (role, hasToken, mock, expected) => {
            expect(bookingAccess({ role, hasToken, mock })).toBe(expected);
        },
    );
});

describe("bookingLoginRoute (HU44 CA02)", () => {
    it("leva ao login do consumidor lembrando a experiência", () => {
        expect(bookingLoginRoute("e1")).toBe("/login/consumer?pre-reserva=e1");
    });

    it("codifica caracteres especiais do id", () => {
        expect(bookingLoginRoute("a b/c")).toBe(
            "/login/consumer?pre-reserva=a+b%2Fc",
        );
    });
});

describe("bookingReturnRoute (HU44 CA02)", () => {
    it("devolve o consumidor ao formulário depois do login", () => {
        expect(
            bookingReturnRoute("/login/consumer?pre-reserva=e1", "consumer"),
        ).toBe("/pre-reserva/e1");
    });

    it("preserva o id com caracteres especiais", () => {
        expect(
            bookingReturnRoute(bookingLoginRoute("a b/c"), "consumer"),
        ).toBe(bookingRoute("a b/c"));
    });

    it("não devolve ao formulário quem entrou como produtor", () => {
        expect(
            bookingReturnRoute("/login/consumer?pre-reserva=e1", "producer"),
        ).toBeNull();
    });

    it("não faz nada quando o login não veio da pré-reserva", () => {
        expect(bookingReturnRoute("/login/consumer", "consumer")).toBeNull();
    });
});

describe("experienceDetailsRoute", () => {
    it("monta a rota do detalhe da experiência", () => {
        expect(experienceDetailsRoute("a b")).toBe(
            "/oferta/a%20b?tipo=experiencia",
        );
    });
});

/** Botão no detalhe (HU44 CA01): visitante (vai ao login) e consumidor. */
export function canRequestBooking(role: string | null): boolean {
    return role === null || role === "consumer";
}

describe("canRequestBooking (HU44 CA01)", () => {
    it.each([
        [null, true],
        ["consumer", true],
        ["producer", false],
        ["admin", false],
    ] as const)("perfil %s → %s", (role, expected) => {
        expect(canRequestBooking(role)).toBe(expected);
    });
});