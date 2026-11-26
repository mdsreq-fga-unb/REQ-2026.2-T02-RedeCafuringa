import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";
import type {
    BookingDetail,
    BookingPayment,
} from "@/features/bookings/bookingDetails";

afterEach(cleanup);

const payment: BookingPayment = {
    totalCents: 18200,
    depositCents: 9100,
    remainingCents: 9100,
    status: "aguardando-sinal",
    depositDeadline: "2026-11-22T13:30:00.000Z",
};

function booking(overrides: Partial<BookingDetail> = {}): BookingDetail {
    return {
        id: "b1",
        experienceId: "e1",
        date: "2026-12-20",
        time: "09:00",
        participants: 4,
        paymentMethod: "dinheiro",
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

function renderProducer(status: BookingPayment["status"]) {
    const waive = vi
        .fn()
        .mockResolvedValue({ ...payment, status: "dispensado" });
    const received = vi
        .fn()
        .mockResolvedValue({ ...payment, status: "pagamento-recebido" });
    render(
        <BookingDetailPage
            id="b1"
            role="producer"
            load={vi
                .fn()
                .mockResolvedValue(
                    booking({ payment: { ...payment, status } }),
                )}
            waiveDeposit={waive}
            reportPaymentReceived={received}
            onNavigate={vi.fn()}
        />,
    );
    return { waive, received };
}

describe("produtora — sem sinal e pagamento recebido", () => {
    it.each(["aguardando-sinal", "expirado"] as const)(
        "%s: confirma sem sinal, sabendo do risco",
        async (status) => {
            const { waive } = renderProducer(status);

            expect(
                await screen.findByText(
                    "Sem sinal, a vaga fica garantida mesmo que a pessoa não compareça.",
                ),
            ).toBeTruthy();
            fireEvent.click(
                screen.getByRole("button", { name: "Confirmar sem sinal" }),
            );

            expect(waive).toHaveBeenCalledWith("b1");
            expect(
                await screen.findByRole("button", {
                    name: "Pagamento recebido",
                }),
            ).toBeTruthy();
        },
    );

    it("prazo vencido: ainda pode confirmar o sinal que chegou atrasado", async () => {
        renderProducer("expirado");

        expect(
            await screen.findByRole("button", { name: "Confirmar sinal" }),
        ).toBeTruthy();
    });

    it.each(["sinal-confirmado", "dispensado"] as const)(
        "%s: registra o pagamento recebido",
        async (status) => {
            const { received } = renderProducer(status);

            fireEvent.click(
                await screen.findByRole("button", {
                    name: "Pagamento recebido",
                }),
            );

            expect(await screen.findByText("Pagamento recebido.")).toBeTruthy();
            expect(received).toHaveBeenCalledWith("b1");
            expect(
                screen.queryByRole("button", { name: "Pagamento recebido" }),
            ).toBeNull();
        },
    );
});

describe("consumidora — sem Pix e pagamento recebido", () => {
    it("não consegue pagar por Pix: fala com a produtora pelo WhatsApp", async () => {
        render(
            <BookingDetailPage
                id="b1"
                role="consumer"
                load={vi.fn().mockResolvedValue(booking())}
                loadProducerPhone={vi.fn().mockResolvedValue("61999998888")}
                onNavigate={vi.fn()}
            />,
        );

        const link = await screen.findByRole("link", {
            name: "Não consegue pagar por Pix? Fale com a produtora (abre o WhatsApp)",
        });
        expect(link.getAttribute("href")).toBe(
            `https://wa.me/5561999998888?text=${encodeURIComponent(
                "Olá! Tenho uma pré-reserva de Sabores e caminhos do Cerrado para 20/12/2026 e não consigo pagar o sinal por Pix. Podemos combinar outra forma?",
            )}`,
        );
        expect(link.getAttribute("target")).toBe("_blank");
    });

    it("vê quando a produtora registrou o pagamento", async () => {
        render(
            <BookingDetailPage
                id="b1"
                role="consumer"
                load={vi.fn().mockResolvedValue(
                    booking({
                        payment: { ...payment, status: "pagamento-recebido" },
                    }),
                )}
                onNavigate={vi.fn()}
            />,
        );

        expect(
            await screen.findByText(
                "A produtora registrou o pagamento. Tudo certo para o dia!",
            ),
        ).toBeTruthy();
    });
});
