import { describe, expect, it } from "vitest";
import {
    acceptedPaymentMethods,
    paymentOptionsFor,
} from "@/features/bookings/bookingOptions";

// Mesma regra da API (backend/src/modules/bookings/domain/booking.ts).
describe("acceptedPaymentMethods: formas que a produtora aceita", () => {
    it("só as formas cadastradas na experiência, na ordem do app", () => {
        expect(
            acceptedPaymentMethods({
                requiresDeposit: false,
                dayPaymentMethods: ["cartao_debito", "dinheiro"],
            }),
        ).toEqual(["dinheiro", "cartao_debito"]);
    });

    it("com sinal, o Pix sempre entra (o sinal é pago por Pix)", () => {
        expect(
            acceptedPaymentMethods({
                requiresDeposit: true,
                dayPaymentMethods: ["dinheiro"],
            }),
        ).toEqual(["pix", "dinheiro"]);
    });

    it("experiência sem a informação de sinal pede sinal: inclui o Pix", () => {
        expect(
            acceptedPaymentMethods({ dayPaymentMethods: ["dinheiro"] }),
        ).toEqual(["pix", "dinheiro"]);
    });

    it("sem nenhuma forma cadastrada, aceita todas para não travar a reserva", () => {
        const all = ["pix", "dinheiro", "cartao_credito", "cartao_debito"];
        expect(acceptedPaymentMethods({ requiresDeposit: false })).toEqual(all);
        expect(
            acceptedPaymentMethods({
                requiresDeposit: true,
                dayPaymentMethods: [],
            }),
        ).toEqual(all);
    });
});

describe("paymentOptionsFor: opções do formulário de pré-reserva", () => {
    it("mostra só as formas aceitas, com o nome legível", () => {
        expect(
            paymentOptionsFor({
                requiresDeposit: false,
                dayPaymentMethods: ["dinheiro", "cartao_credito"],
            }),
        ).toEqual([
            { value: "dinheiro", label: "Dinheiro" },
            { value: "cartao_credito", label: "Cartão de crédito" },
        ]);
    });
});
