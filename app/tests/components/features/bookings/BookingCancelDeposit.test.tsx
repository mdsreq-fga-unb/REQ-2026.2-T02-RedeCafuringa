import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingCancelPage } from "@/features/bookings/BookingCancelPage";
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";
import type {
    BookingDetail,
    BookingPayment,
} from "@/features/bookings/bookingDetails";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

const payment: BookingPayment = {
    totalCents: 18200,
    depositCents: 9100,
    remainingCents: 9100,
    status: "sinal-confirmado",
};

function booking(overrides: Partial<BookingDetail> = {}): BookingDetail {
    return {
        id: "b1",
        experienceId: "e1",
        date: "2026-12-20",
        time: "09:00",
        participants: 4,
        paymentMethod: "pix",
        status: "aceita",
        createdAt: "2026-11-21T13:00:00.000Z",
        updatedAt: "2026-11-21T13:30:00.000Z",
        experience: {
            name: "Sabores e caminhos do Cerrado",
            local: "Sítio Raízes",
            pricePerPerson: 45.5,
            available: true,
        },
        counterpart: { id: "p1", name: "Sítio Raízes" },
        payment,
        ...overrides,
    };
}

function at(iso: string) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(iso));
}

describe("consumidora — cancelar a pré-reserva aceita com sinal", () => {
    function renderCancel(cancel = vi.fn()) {
        render(
            <BookingCancelPage
                id="b1"
                load={vi.fn().mockResolvedValue(booking())}
                cancel={cancel}
                onNavigate={vi.fn()}
            />,
        );
        return cancel;
    }

    it("com antecedência: avisa, antes de confirmar, que a produtora devolve o sinal", async () => {
        at("2026-12-01T12:00:00.000Z");
        renderCancel();

        expect(
            await screen.findByText(
                "A produtora vai devolver o sinal de R$ 91,00 por Pix.",
            ),
        ).toBeTruthy();
    });

    it("em cima da hora: avisa que o sinal não será devolvido", async () => {
        at("2026-12-19T12:00:00.000Z");
        renderCancel();

        expect(
            await screen.findByText(
                "Faltam menos de 72 horas: o sinal de R$ 91,00 não será devolvido.",
            ),
        ).toBeTruthy();
    });

    it("depois de cancelar, mostra o destino do sinal que a API registrou", async () => {
        const cancel = renderCancel(
            vi.fn().mockResolvedValue({
                ...booking({ status: "cancelada" }),
                deposit: { result: "devolver", cents: 9100 },
            }),
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Sim, cancelar solicitação",
            }),
        );

        expect(
            await screen.findByText(
                "A produtora vai devolver o sinal de R$ 91,00 por Pix.",
            ),
        ).toBeTruthy();
        expect(cancel).toHaveBeenCalledWith("b1");
    });
});

describe("detalhe — cancelamento e devolução do sinal", () => {
    it("a consumidora também cancela a pré-reserva aceita", async () => {
        const onNavigate = vi.fn();
        render(
            <BookingDetailPage
                id="b1"
                role="consumer"
                load={vi.fn().mockResolvedValue(booking())}
                onNavigate={onNavigate}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", { name: "Cancelar solicitação" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/reservas/b1/cancelar");
    });

    it("a produtora cancela a aceita depois de confirmar, sabendo que devolve o sinal", async () => {
        const cancelled = booking({
            status: "cancelada",
            payment: { ...payment, refund: "pendente" },
        });
        const load = vi
            .fn()
            .mockResolvedValueOnce(booking())
            .mockResolvedValueOnce(cancelled);
        const cancel = vi.fn().mockResolvedValue({
            ...cancelled,
            deposit: { result: "devolver", cents: 9100 },
        });
        render(
            <BookingDetailPage
                id="b1"
                role="producer"
                load={load}
                cancelAsProducer={cancel}
                onNavigate={vi.fn()}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", { name: "Cancelar pré-reserva" }),
        );
        expect(
            screen.getByText(
                "A consumidora verá a pré-reserva como cancelada, e você devolve o sinal de R$ 91,00 por Pix.",
            ),
        ).toBeTruthy();
        expect(cancel).not.toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole("button", { name: "Sim, cancelar pré-reserva" }),
        );

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Pré-reserva cancelada",
            }),
        ).toBeTruthy();
        expect(cancel).toHaveBeenCalledWith("b1");
    });

    it("Manter pré-reserva fecha a confirmação sem cancelar", async () => {
        const cancel = vi.fn();
        render(
            <BookingDetailPage
                id="b1"
                role="producer"
                load={vi.fn().mockResolvedValue(booking())}
                cancelAsProducer={cancel}
                onNavigate={vi.fn()}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", { name: "Cancelar pré-reserva" }),
        );
        fireEvent.click(
            screen.getByRole("button", { name: "Manter pré-reserva" }),
        );

        expect(
            screen.queryByRole("button", { name: "Sim, cancelar pré-reserva" }),
        ).toBeNull();
        expect(cancel).not.toHaveBeenCalled();
    });

    it("a produtora vê que deve devolver o sinal e registra a devolução", async () => {
        const refunded = vi
            .fn()
            .mockResolvedValue({ ...payment, refund: "feita" });
        render(
            <BookingDetailPage
                id="b1"
                role="producer"
                load={vi.fn().mockResolvedValue(
                    booking({
                        status: "cancelada",
                        payment: { ...payment, refund: "pendente" },
                    }),
                )}
                reportDepositRefunded={refunded}
                onNavigate={vi.fn()}
            />,
        );

        expect(
            await screen.findByText(
                "Devolva o sinal de R$ 91,00 por Pix para a consumidora.",
            ),
        ).toBeTruthy();
        fireEvent.click(
            screen.getByRole("button", { name: "Sinal devolvido" }),
        );

        expect(
            await screen.findByText(
                "Devolução do sinal de R$ 91,00 registrada.",
            ),
        ).toBeTruthy();
        expect(refunded).toHaveBeenCalledWith("b1");
    });

    it.each([
        ["pendente", "A produtora vai devolver o sinal de R$ 91,00 por Pix."],
        ["feita", "A produtora registrou a devolução do sinal de R$ 91,00."],
        ["retido", "O sinal de R$ 91,00 ficou com a produtora."],
    ] as const)("a consumidora vê a devolução %s", async (refund, text) => {
        render(
            <BookingDetailPage
                id="b1"
                role="consumer"
                load={vi.fn().mockResolvedValue(
                    booking({
                        status: "cancelada",
                        payment: { ...payment, refund },
                    }),
                )}
                onNavigate={vi.fn()}
            />,
        );

        expect(await screen.findByText(text)).toBeTruthy();
    });

    it("a produtora não vê Cancelar pré-reserva na pendente", async () => {
        render(
            <BookingDetailPage
                id="b1"
                role="producer"
                load={vi
                    .fn()
                    .mockResolvedValue(
                        booking({ status: "pendente", payment: undefined }),
                    )}
                onNavigate={vi.fn()}
            />,
        );

        await screen.findByRole("heading", { level: 1 });
        expect(
            screen.queryByRole("button", { name: "Cancelar pré-reserva" }),
        ).toBeNull();
    });
});
