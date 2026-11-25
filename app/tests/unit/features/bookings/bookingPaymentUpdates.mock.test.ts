import { beforeEach, describe, expect, it, vi } from "vitest";
import { listBookingUpdates } from "@/features/bookings/bookingNotificationsService";
import {
    createMockBooking,
    DEMO_BOOKINGS_KEY,
    listMockBookings,
} from "@/features/bookings/mockBookingService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));
vi.stubGlobal("fetch", vi.fn());

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cafuringa-role", "consumer");
    localStorage.setItem("cafuringa-user-id", "1");
    localStorage.setItem("cafuringa-token", "demo-1");
});

describe("notificações do sinal na demonstração", () => {
    it("a aceita avisa o sinal por pagar, com o mesmo id da API", async () => {
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
                listMockBookings().map((item) => ({
                    ...item,
                    status: "aceita",
                    atualizadoEm: new Date().toISOString(),
                })),
            ),
        );

        const [update] = await listBookingUpdates(new AbortController().signal);

        expect(update).toMatchObject({
            id: `${enviada.id}:aceita:aguardando-sinal`,
            pagamento: "aguardando-sinal",
        });
    });
});
