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