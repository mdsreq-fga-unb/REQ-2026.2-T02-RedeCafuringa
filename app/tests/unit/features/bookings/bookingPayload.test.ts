import { describe, expect, it } from "vitest";
import { buildBookingPayload } from "@/features/bookings/bookingPayload";
import type { BookingFormValues } from "@/features/bookings/bookingTypes";

const form: BookingFormValues = {
    data: "2026-12-20",
    horario: "09:00",
    participantes: "2",
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
};

describe("buildBookingPayload (HU44 CA05)", () => {
    it("monta o corpo do POST /bookings com a experiência e os dados do formulário", () => {
        expect(buildBookingPayload("64b0c0ffee0000000000e001", form)).toEqual({
            experienciaId: "64b0c0ffee0000000000e001",
            data: "2026-12-20",
            horario: "09:00",
            participantes: 2,
            formaPagamento: "pix",
            mensagem: "Gostaríamos de conhecer o sítio.",
        });
    });

    it("remove espaços das pontas dos campos de texto", () => {
        const payload = buildBookingPayload("e1", {
            ...form,
            data: " 2026-12-20 ",
            mensagem: "  Olá!  ",
        });
        expect(payload.data).toBe("2026-12-20");
        expect(payload.mensagem).toBe("Olá!");
    });

    it.each(["", "   "])(
        "omite a mensagem quando ela está vazia (%j)",
        (mensagem) => {
            const payload = buildBookingPayload("e1", { ...form, mensagem });
            expect("mensagem" in payload).toBe(false);
        },
    );
});
