import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    BookingPaymentError,
    confirmDeposit,
    reportPaymentReceived,
    waiveDeposit,
} from "@/features/bookings/bookingPaymentService";
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
    localStorage.setItem("cafuringa-token", `demo-${id}`);
}

async function accepted() {
    signInAs("consumer", "1");
    const enviada = await createMockBooking({
        experienciaId: "queijos",
        data: "2026-12-20",
        horario: "09:00",
        participantes: 2,
        formaPagamento: "dinheiro",
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
    signInAs("producer", "demo-jefferson");
    return enviada.id;
}

beforeEach(() => localStorage.clear());

describe("sem sinal e pagamento recebido — demonstração", () => {
    it("confirmar sem sinal e depois registrar o pagamento", async () => {
        const id = await accepted();

        expect((await waiveDeposit(id)).status).toBe("dispensado");
        expect((await reportPaymentReceived(id)).status).toBe(
            "pagamento-recebido",
        );
    });

    it("registrar o pagamento antes de resolver o sinal: recusa como a API", async () => {
        const id = await accepted();

        await expect(reportPaymentReceived(id)).rejects.toEqual(
            new BookingPaymentError(
                "Confirme ou dispense o sinal antes de registrar o pagamento.",
            ),
        );
    });

    it("com o sinal confirmado, registra o pagamento", async () => {
        const id = await accepted();
        await confirmDeposit(id);

        expect((await reportPaymentReceived(id)).status).toBe(
            "pagamento-recebido",
        );
        await expect(waiveDeposit(id)).rejects.toEqual(
            new BookingPaymentError(
                "O pagamento desta pré-reserva já foi registrado.",
            ),
        );
    });
});
