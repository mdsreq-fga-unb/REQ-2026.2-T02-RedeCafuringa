import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    cancelBooking,
    cancelBookingByProducer,
} from "@/features/bookings/bookingCancelService";
import {
    confirmDeposit,
    reportDepositRefunded,
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

/** Aceita e com o sinal confirmado; `data` decide as 72 horas. */
async function paidBooking(data: string) {
    signInAs("consumer", "1");
    const enviada = await createMockBooking({
        experienciaId: "queijos",
        data,
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
    signInAs("producer", "demo-jefferson");
    await confirmDeposit(enviada.id);
    return enviada.id;
}

const daysFromNow = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

beforeEach(() => localStorage.clear());

describe("cancelamento com sinal na demonstração", () => {
    it("consumidora cancela com antecedência: a produtora devolve e registra", async () => {
        const id = await paidBooking(daysFromNow(30));
        signInAs("consumer", "1");

        const result = await cancelBooking(id);

        expect(result.deposit).toEqual({ result: "devolver", cents: 4500 });
        expect((await getBooking(id))?.payment?.refund).toBe("pendente");

        signInAs("producer", "demo-jefferson");
        expect((await reportDepositRefunded(id)).refund).toBe("feita");
        signInAs("consumer", "1");
        expect((await getBooking(id))?.payment?.refund).toBe("feita");
    });

    it("consumidora cancela em cima da hora: o sinal fica com a produtora", async () => {
        const id = await paidBooking(daysFromNow(1));
        signInAs("consumer", "1");

        expect((await cancelBooking(id)).deposit).toEqual({
            result: "retido",
            cents: 4500,
        });
    });

    it("produtora cancela: sempre devolve", async () => {
        const id = await paidBooking(daysFromNow(1));

        expect((await cancelBookingByProducer(id)).deposit).toEqual({
            result: "devolver",
            cents: 4500,
        });
        signInAs("consumer", "1");
        expect((await getBooking(id))?.status).toBe("cancelada");
    });
});
