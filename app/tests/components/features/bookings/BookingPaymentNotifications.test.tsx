import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";
import { BookingNotificationsPage } from "@/features/bookings/BookingNotificationsPage";
import type { BookingDetail } from "@/features/bookings/bookingDetails";
import type { BookingUpdate } from "@/features/bookings/bookingNotificationsService";

vi.mock(
    "@/features/bookings/bookingNotificationsService",
    async (original) => ({
        ...(await original<
            typeof import("@/features/bookings/bookingNotificationsService")
        >()),
        listBookingUpdates: vi.fn().mockResolvedValue([]),
    }),
);

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cafuringa-role", "producer");
    localStorage.setItem("cafuringa-user-id", "p1");
});

afterEach(cleanup);

const update: BookingUpdate = {
    id: "r1:aceita:comprovante-enviado",
    reservaId: "r1",
    codigo: "CAF-000001",
    experienciaNome: "Trilha",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    status: "aceita",
    pagamento: "comprovante-enviado",
    nova: true,
};

describe("notificações do sinal na tela", () => {
    it("a produtora vê o que fazer com o sinal", async () => {
        render(
            <BookingNotificationsPage
                updates={[update]}
                onUpdatesLoaded={vi.fn()}
                onNavigate={vi.fn()}
            />,
        );

        expect(
            await screen.findByText("Confira o pagamento do sinal"),
        ).toBeTruthy();
    });

    it("abrir o detalhe marca como lida a mudança atual do sinal", async () => {
        const booking: BookingDetail = {
            id: "r1",
            experienceId: "e1",
            date: "2026-12-20",
            time: "09:00",
            participants: 2,
            paymentMethod: "pix",
            status: "aceita",
            createdAt: "2026-11-21T13:00:00.000Z",
            updatedAt: "2026-11-21T13:30:00.000Z",
            experience: {
                name: "Trilha",
                local: "Sítio",
                pricePerPerson: 45,
                available: true,
            },
            counterpart: { id: "c1", name: "Ana" },
            payment: {
                totalCents: 9000,
                depositCents: 4500,
                remainingCents: 4500,
                status: "comprovante-enviado",
            },
        };
        render(
            <BookingDetailPage
                id="r1"
                role="producer"
                load={vi.fn().mockResolvedValue(booking)}
                onNavigate={vi.fn()}
            />,
        );

        await waitFor(() =>
            expect(
                localStorage.getItem(
                    "cafuringa-booking-update:producer:p1:r1:aceita:comprovante-enviado",
                ),
            ).toBe("read"),
        );
    });
});
