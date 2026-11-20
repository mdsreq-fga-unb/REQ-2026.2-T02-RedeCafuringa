import { describe, expect, it } from "vitest";
import { adaptBookingResponse } from "@/features/bookings/bookingAdapter";
import type {
    BookingResponse,
    BookingStatus,
} from "@/features/bookings/bookingTypes";

const response: BookingResponse = {
    id: "64b0c0ffee0000000000b001",
    experienciaId: "64b0c0ffee0000000000e001",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
    status: "pendente",
    criadoEm: "2026-11-19T13:00:00.000Z",
};

describe("adaptBookingResponse (HU44 CA05 e CA06)", () => {
    it("adapta a resposta da API para o modelo do front", () => {
        expect(adaptBookingResponse(response)).toEqual({
            id: "64b0c0ffee0000000000b001",
            experienceId: "64b0c0ffee0000000000e001",
            date: "2026-12-20",
            time: "09:00",
            participants: 2,
            paymentMethod: "pix",
            message: "Gostaríamos de conhecer o sítio.",
            status: "pendente",
            createdAt: "2026-11-19T13:00:00.000Z",
        });
    });

    it("omite a mensagem quando a API não envia", () => {
        const withoutMessage: BookingResponse = { ...response };
        delete withoutMessage.mensagem;
        expect("message" in adaptBookingResponse(withoutMessage)).toBe(false);
    });

    it.each<BookingStatus>(["pendente", "aceita", "recusada", "cancelada"])(
        "preserva o status %s",
        (status) => {
            expect(adaptBookingResponse({ ...response, status }).status).toBe(
                status,
            );
        },
    );
});