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

// 19/11/2026 10:00, horário local (o mês do Date começa em 0)
const NOW = new Date(2026, 10, 19, 10, 0);

const validate = (values: BookingFormValues, now: Date = NOW) =>
    validateBookingForm(values, now);

describe("validateBookingForm: campos obrigatórios (HU44 CA04)", () => {
    it("não retorna erros quando tudo está preenchido", () => {
        expect(validate(validForm)).toEqual({});
    });

    it("exige a data desejada", () => {
        expect(validate({ ...validForm, data: "" })).toEqual({
            data: "Informe a data desejada.",
        });
    });

    it("exige o horário", () => {
        expect(validate({ ...validForm, horario: "" })).toEqual({
            horario: "Escolha o horário.",
        });
    });

    it("exige o número de participantes", () => {
        expect(validate({ ...validForm, participantes: "" })).toEqual({
            participantes: "Informe o número de participantes.",
        });
    });

    it("exige a forma de pagamento", () => {
        expect(validate({ ...validForm, formaPagamento: "" })).toEqual({
            formaPagamento: "Escolha a forma de pagamento.",
        });
    });

    it("aceita a mensagem ao produtor vazia (campo opcional)", () => {
        expect(validate({ ...validForm, mensagem: "" })).toEqual({});
    });

    it("aponta um erro por campo quando tudo está vazio", () => {
        const errors = validate({
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
            expect(validate({ ...validForm, participantes })).toEqual({
                participantes: "Informe de 1 a 50 participantes.",
            });
        },
    );

    it.each(["1", "50"])("aceita %s participante(s)", (participantes) => {
        expect(validate({ ...validForm, participantes })).toEqual({});
    });

    it.each(["09:30", "24:00", "9:00"])("rejeita o horário %s", (horario) => {
        expect(validate({ ...validForm, horario })).toEqual({
            horario: "Escolha um horário da lista.",
        });
    });

    it.each(["00:00", "23:00"])("aceita o horário %s", (horario) => {
        expect(validate({ ...validForm, horario })).toEqual({});
    });

    it("rejeita uma forma de pagamento fora da lista", () => {
        expect(validate({ ...validForm, formaPagamento: "boleto" })).toEqual({
            formaPagamento: "Escolha uma forma de pagamento da lista.",
        });
    });

    it.each(["pix", "dinheiro", "cartao_credito", "cartao_debito"])(
        "aceita a forma de pagamento %s",
        (formaPagamento) => {
            expect(validate({ ...validForm, formaPagamento })).toEqual({});
        },
    );
});

describe("validateBookingForm: data real e fora do passado (HU44 RN21)", () => {
    it.each(["2026-13-01", "2026-02-30", "20/12/2026", "2026-1-5", "abc"])(
        "rejeita %s como data",
        (data) => {
            expect(validate({ ...validForm, data })).toEqual({
                data: "Informe uma data válida.",
            });
        },
    );

    it("rejeita uma data de ontem", () => {
        expect(validate({ ...validForm, data: "2026-11-18" })).toEqual({
            data: "A data não pode estar no passado.",
        });
    });

    it("rejeita a data de exemplo do protótipo (17/10/2026), já passada", () => {
        expect(validate({ ...validForm, data: "2026-10-17" })).toEqual({
            data: "A data não pode estar no passado.",
        });
    });

    it("aceita hoje em um horário que ainda não chegou", () => {
        expect(
            validate({ ...validForm, data: "2026-11-19", horario: "11:00" }),
        ).toEqual({});
    });

    it("rejeita hoje em um horário que já passou", () => {
        expect(
            validate({ ...validForm, data: "2026-11-19", horario: "09:00" }),
        ).toEqual({ horario: "Esse horário já passou." });
    });

    it("rejeita hoje exatamente no horário atual", () => {
        expect(
            validate({ ...validForm, data: "2026-11-19", horario: "10:00" }),
        ).toEqual({ horario: "Esse horário já passou." });
    });

    it("aceita amanhã às 00:00", () => {
        expect(
            validate({ ...validForm, data: "2026-11-20", horario: "00:00" }),
        ).toEqual({});
    });

    it("não soma o erro de horário passado a um horário fora da lista", () => {
        expect(
            validate({ ...validForm, data: "2026-11-19", horario: "09:30" }),
        ).toEqual({ horario: "Escolha um horário da lista." });
    });
});
