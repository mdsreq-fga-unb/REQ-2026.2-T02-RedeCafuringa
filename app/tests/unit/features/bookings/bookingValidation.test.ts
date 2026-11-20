import { describe, expect, it } from "vitest";
import { validateBookingForm } from "@/features/bookings/bookingValidation";
import type { BookingFormValues } from "@/features/bookings/bookingTypes";

const validForm: BookingFormValues = {
    data: "2026-12-20",
    horario: "09:00",
    participantes: "2",
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
};

describe("validateBookingForm: campos obrigatórios (HU44 CA04)", () => {
    it("não retorna erros quando tudo está preenchido", () => {
        expect(validateBookingForm(validForm)).toEqual({});
    });

    it("exige a data desejada", () => {
        expect(validateBookingForm({ ...validForm, data: "" })).toEqual({
            data: "Informe a data desejada.",
        });
    });

    it("exige o horário", () => {
        expect(validateBookingForm({ ...validForm, horario: "" })).toEqual({
            horario: "Escolha o horário.",
        });
    });

    it("exige o número de participantes", () => {
        expect(
            validateBookingForm({ ...validForm, participantes: "" }),
        ).toEqual({ participantes: "Informe o número de participantes." });
    });

    it("exige a forma de pagamento", () => {
        expect(
            validateBookingForm({ ...validForm, formaPagamento: "" }),
        ).toEqual({ formaPagamento: "Escolha a forma de pagamento." });
    });

    it("aceita a mensagem ao produtor vazia (campo opcional)", () => {
        expect(validateBookingForm({ ...validForm, mensagem: "" })).toEqual({});
    });

    it("aponta um erro por campo quando tudo está vazio", () => {
        const errors = validateBookingForm({
            data: "",
            horario: "",
            participantes: "",
            formaPagamento: "",
            mensagem: "",
        });
        expect(Object.keys(errors).sort()).toEqual([
            "data",
            "formaPagamento",
            "horario",
            "participantes",
        ]);
    });
});

describe("validateBookingForm: valores permitidos (HU44 CA04)", () => {
    it.each(["0", "51", "2.5", "-1", "abc"])(
        "rejeita %s como número de participantes",
        (participantes) => {
            expect(validateBookingForm({ ...validForm, participantes })).toEqual(
                { participantes: "Informe de 1 a 50 participantes." },
            );
        },
    );

    it.each(["1", "50"])("aceita %s participante(s)", (participantes) => {
        expect(validateBookingForm({ ...validForm, participantes })).toEqual({});
    });

    it.each(["09:30", "24:00", "9:00"])(
        "rejeita o horário %s",
        (horario) => {
            expect(validateBookingForm({ ...validForm, horario })).toEqual({
                horario: "Escolha um horário da lista.",
            });
        },
    );

    it.each(["00:00", "23:00"])("aceita o horário %s", (horario) => {
        expect(validateBookingForm({ ...validForm, horario })).toEqual({});
    });

    it("rejeita uma forma de pagamento fora da lista", () => {
        expect(
            validateBookingForm({ ...validForm, formaPagamento: "boleto" }),
        ).toEqual({
            formaPagamento: "Escolha uma forma de pagamento da lista.",
        });
    });

    it.each(["pix", "dinheiro", "cartao_credito", "cartao_debito"])(
        "aceita a forma de pagamento %s",
        (formaPagamento) => {
            expect(
                validateBookingForm({ ...validForm, formaPagamento }),
            ).toEqual({});
        },
    );
});