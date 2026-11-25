import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    BookingPaymentError,
    confirmDeposit,
    reportDepositNotFound,
    reportDepositSent,
} from "@/features/bookings/bookingPaymentService";
import { getBooking } from "@/features/bookings/bookingQueryService";
import {
    createMockBooking,
    DEMO_BOOKINGS_KEY,
    listMockBookings,
} from "@/features/bookings/mockBookingService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));
vi.stubGlobal("fetch", vi.fn());

function signInAs(role: "consumer" | "producer", id: string) {
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-user-id", id);
    localStorage.setItem("cafuringa-name", "Ana");
    localStorage.setItem("cafuringa-token", `demo-${id}`);
}

/** Pré-reserva da experiência "queijos" (de demo-jefferson), já aceita agora. */
async function acceptedBooking() {
    signInAs("consumer", "1");
    const enviada = await createMockBooking({
        experienciaId: "queijos",
        data: "2026-12-20",
        horario: "09:00",
        participantes: 2,
        formaPagamento: "pix",
    });
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify(
            listMockBookings().map((item) =>
                item.id === enviada.id
                    ? {
                          ...item,
                          status: "aceita",
                          atualizadoEm: new Date().toISOString(),
                      }
                    : item,
            ),
        ),
    );
    return enviada.id;
}

beforeEach(() => localStorage.clear());

describe("sinal por Pix na demonstração", () => {
    it("aviso da consumidora, contestação e confirmação da produtora", async () => {
        const id = await acceptedBooking();

        expect((await reportDepositSent(id)).status).toBe(
            "comprovante-enviado",
        );
        expect((await getBooking(id))?.payment?.status).toBe(
            "comprovante-enviado",
        );

        signInAs("producer", "demo-jefferson");
        expect((await reportDepositNotFound(id)).status).toBe(
            "aguardando-sinal",
        );
        expect((await confirmDeposit(id)).status).toBe("sinal-confirmado");

        signInAs("consumer", "1");
        expect((await getBooking(id))?.payment?.status).toBe(
            "sinal-confirmado",
        );
    });

    it("recusa como a API: aviso repetido e contestação sem aviso", async () => {
        const id = await acceptedBooking();
        await reportDepositSent(id);

        await expect(reportDepositSent(id)).rejects.toEqual(
            new BookingPaymentError(
                "Você já avisou que pagou o sinal. A produtora vai conferir.",
            ),
        );

        signInAs("producer", "demo-jefferson");
        await confirmDeposit(id);
        await expect(reportDepositNotFound(id)).rejects.toEqual(
            new BookingPaymentError(
                "O sinal desta pré-reserva já foi confirmado.",
            ),
        );
    });

    it("pré-reserva de outra conta: não encontrada", async () => {
        const id = await acceptedBooking();
        signInAs("consumer", "9");

        await expect(reportDepositSent(id)).rejects.toEqual(
            new BookingPaymentError("Pré-reserva não encontrada."),
        );
    });
});
