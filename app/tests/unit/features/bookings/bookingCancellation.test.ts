import { describe, expect, it } from "vitest";
import { depositOnCancel } from "@/features/bookings/bookingCancellation";
import type { BookingPayment } from "@/features/bookings/bookingDetails";

// Experiência em 20/12/2026 às 09:00 de Brasília (12:00 UTC).
const booking = (status: BookingPayment["status"] = "sinal-confirmado") => ({
    date: "2026-12-20",
    time: "09:00",
    payment: {
        totalCents: 18200,
        depositCents: 9100,
        remainingCents: 9100,
        status,
    },
});
const at = (iso: string) => new Date(iso);

describe("cancelamento com sinal — o que mostrar antes de confirmar", () => {
    it("consumidora com 72 horas ou mais: a produtora devolve", () => {
        expect(
            depositOnCancel(
                booking(),
                "consumidora",
                at("2026-12-17T12:00:00.000Z"),
            ),
        ).toEqual({ result: "devolver", cents: 9100 });
    });

    it("consumidora com menos de 72 horas: o sinal fica com a produtora", () => {
        expect(
            depositOnCancel(
                booking(),
                "consumidora",
                at("2026-12-17T12:00:01.000Z"),
            ),
        ).toEqual({ result: "retido", cents: 9100 });
    });

    it("comprovante enviado conta como pago", () => {
        expect(
            depositOnCancel(
                booking("comprovante-enviado"),
                "consumidora",
                at("2026-12-19T12:00:00.000Z"),
            ),
        ).toEqual({ result: "retido", cents: 9100 });
    });

    it("produtora: sempre devolve", () => {
        expect(
            depositOnCancel(
                booking(),
                "produtora",
                at("2026-12-20T11:00:00.000Z"),
            ),
        ).toEqual({ result: "devolver", cents: 9100 });
    });

    it.each(["aguardando-sinal", "expirado", "dispensado"] as const)(
        "%s: não há sinal pago",
        (status) => {
            expect(
                depositOnCancel(
                    booking(status),
                    "consumidora",
                    at("2026-12-01T00:00:00.000Z"),
                ),
            ).toBeNull();
        },
    );

    it("sem pagamento (pendente): não há sinal", () => {
        expect(
            depositOnCancel(
                { date: "2026-12-20", time: "09:00" },
                "consumidora",
            ),
        ).toBeNull();
    });
});
