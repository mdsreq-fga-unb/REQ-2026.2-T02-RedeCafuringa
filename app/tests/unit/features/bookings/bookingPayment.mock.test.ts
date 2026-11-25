import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBooking } from "@/features/bookings/bookingQueryService";
import {
    createMockBooking,
    DEMO_BOOKINGS_KEY,
    listMockBookings,
} from "@/features/bookings/mockBookingService";
import { isNormalizedPixKey } from "@/features/payments/pixCode";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));
vi.stubGlobal("fetch", vi.fn());

function signInAsConsumer() {
    localStorage.setItem("cafuringa-role", "consumer");
    localStorage.setItem("cafuringa-user-id", "1");
    localStorage.setItem("cafuringa-name", "Ana");
    localStorage.setItem("cafuringa-token", "demo-1");
}

/** Simula o aceite da produtora (HU47) direto nos dados da demonstração. */
function accept(id: string, atualizadoEm: string) {
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify(
            listMockBookings().map((item) =>
                item.id === id
                    ? { ...item, status: "aceita", atualizadoEm }
                    : item,
            ),
        ),
    );
}

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("sinal por Pix na demonstração", () => {
    it("a pré-reserva aceita tem sinal de 50%, prazo de 24 horas e um Pix de exemplo", async () => {
        signInAsConsumer();
        const enviada = await createMockBooking({
            experienciaId: "queijos",
            data: "2026-12-20",
            horario: "09:00",
            participantes: 2,
            formaPagamento: "pix",
        });
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-11-21T14:00:00.000Z"));
        accept(enviada.id, "2026-11-21T13:30:00.000Z");

        const detail = await getBooking(enviada.id);

        expect(detail?.payment).toEqual({
            totalCents: 9000,
            depositCents: 4500,
            remainingCents: 4500,
            status: "aguardando-sinal",
            depositDeadline: "2026-11-22T13:30:00.000Z",
        });
        expect(detail?.pix?.txid).toBe(
            enviada.id.replace(/[^A-Za-z0-9]/g, "").slice(0, 25),
        );
        expect(isNormalizedPixKey(detail?.pix?.key ?? "")).toBe(true);
    });

    it("pendente não tem pagamento", async () => {
        signInAsConsumer();
        const enviada = await createMockBooking({
            experienciaId: "queijos",
            data: "2026-12-20",
            horario: "09:00",
            participantes: 2,
            formaPagamento: "pix",
        });

        expect((await getBooking(enviada.id))?.payment).toBeUndefined();
    });
});
