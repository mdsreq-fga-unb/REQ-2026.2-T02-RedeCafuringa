import { describe, expect, it } from "vitest";
import {
    bookingAccess,
    bookingRoute,
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