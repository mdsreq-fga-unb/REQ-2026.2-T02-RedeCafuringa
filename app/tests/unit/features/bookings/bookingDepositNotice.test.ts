import { describe, expect, it } from "vitest";
import { depositNotice } from "@/features/bookings/bookingDepositNotice";

describe("solicitação — aviso do sinal e do pagamento no dia", () => {
    it("com sinal: prazo de 24 horas, valor do sinal e o restante no dia", () => {
        expect(
            depositNotice({
                pricePerPerson: 45.5,
                participants: 2,
                requiresDeposit: true,
                method: "pix",
            }),
        ).toBe(
            "Se a produtora aceitar, você terá 24 horas para pagar o sinal de 50% (R$ 45,50) por Pix e garantir a vaga. O restante (R$ 45,50) você paga no dia, com a produtora.",
        );
    });

    it("com sinal e dinheiro: o sinal é por Pix, o restante em dinheiro", () => {
        expect(
            depositNotice({
                pricePerPerson: 45.5,
                participants: 1,
                requiresDeposit: true,
                method: "dinheiro",
            }),
        ).toBe(
            "Se a produtora aceitar, você terá 24 horas para pagar o sinal de 50% (R$ 22,75) por Pix e garantir a vaga. O restante (R$ 22,75) você paga em dinheiro no dia.",
        );
    });

    it("sem sinal: paga tudo no dia", () => {
        expect(
            depositNotice({
                pricePerPerson: 45.5,
                participants: 2,
                requiresDeposit: false,
                method: "cartao_credito",
            }),
        ).toBe(
            "Esta experiência não pede sinal. Você paga R$ 91,00 no dia, com a produtora.",
        );
    });

    it("sem sinal e dinheiro: lembra de levar trocado", () => {
        expect(
            depositNotice({
                pricePerPerson: 45.5,
                participants: 2,
                requiresDeposit: false,
                method: "dinheiro",
            }),
        ).toBe(
            "Esta experiência não pede sinal. Você paga R$ 91,00 em dinheiro no dia. Leve o valor trocado, se possível.",
        );
    });

    it("experiência gratuita não fala de pagamento", () => {
        expect(
            depositNotice({
                pricePerPerson: 0,
                participants: 2,
                requiresDeposit: true,
                method: "pix",
            }),
        ).toBe("");
    });

    it("sem participantes escolhidos, ainda não há valor para mostrar", () => {
        expect(
            depositNotice({
                pricePerPerson: 45.5,
                participants: 0,
                requiresDeposit: true,
                method: "pix",
            }),
        ).toBe("");
    });

    it("experiência antiga, sem a informação, pede sinal", () => {
        expect(
            depositNotice({
                pricePerPerson: 45,
                participants: 2,
                method: "",
            }),
        ).toMatch(/^Se a produtora aceitar/);
    });
});
