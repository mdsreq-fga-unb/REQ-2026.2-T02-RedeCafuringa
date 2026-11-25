/**
 * Cancelamento com sinal, só para avisar antes de confirmar. A regra é a da
 * API (72 horas, RN20 revista em 25/11/2026); quem decide de verdade é ela, e
 * a tela final mostra o que ela registrou.
 */
import type { BookingPayment } from "./bookingDetails";

export const CANCEL_WITH_REFUND_HOURS = 72;

export type DepositOnCancel = { result: "devolver" | "retido"; cents: number };

/** Brasília não tem horário de verão desde 2019: UTC-3 o ano todo. */
const BRASILIA_OFFSET = "-03:00";
const HOUR_MS = 60 * 60 * 1000;
const PAID = new Set<BookingPayment["status"]>([
    "comprovante-enviado",
    "sinal-confirmado",
]);

export function depositOnCancel(
    booking: { date: string; time: string; payment?: BookingPayment },
    by: "consumidora" | "produtora",
    now: Date = new Date(),
): DepositOnCancel | null {
    const payment = booking.payment;
    if (!payment || !PAID.has(payment.status)) return null;
    const start = new Date(
        `${booking.date}T${booking.time}:00${BRASILIA_OFFSET}`,
    );
    const hours = (start.getTime() - now.getTime()) / HOUR_MS;
    return {
        result:
            by === "produtora" || hours >= CANCEL_WITH_REFUND_HOURS
                ? "devolver"
                : "retido",
        cents: payment.depositCents,
    };
}
