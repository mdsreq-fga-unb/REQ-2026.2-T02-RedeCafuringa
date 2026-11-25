import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";
import type {
    BookingDetail,
    BookingPayment,
} from "@/features/bookings/bookingDetails";
import { BookingPaymentError } from "@/features/bookings/bookingPaymentService";

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
        pix: {
            key: "+5561999998888",
            receiver: "Maria da Silva",
            city: "BRASILIA",
            txid: "b1",
        },
        ...overrides,
    };
}

const MESSAGE =
    "Olá! Paguei o sinal de R$ 91,00 da pré-reserva de Sabores e caminhos do Cerrado para 20/12/2026. Segue o comprovante.";

const openSpy = vi.fn();
const share = vi.fn();
const canShare = vi.fn();

beforeEach(() => {
    openSpy.mockReset();
    share.mockReset().mockResolvedValue(undefined);
    canShare.mockReset().mockReturnValue(true);
    vi.stubGlobal("open", openSpy);
    Object.defineProperty(navigator, "share", {
        configurable: true,
        value: share,
    });
    Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: canShare,
    });
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

function renderConsumer(
    props: Partial<Parameters<typeof BookingDetailPage>[0]> = {},
) {
    const reportSent = vi
        .fn()
        .mockResolvedValue({ ...payment, status: "comprovante-enviado" });
    render(
        <BookingDetailPage
            id="b1"
            role="consumer"
            load={vi.fn().mockResolvedValue(booking())}
            loadProducerPhone={vi.fn().mockResolvedValue("61999998888")}
            reportDepositSent={reportSent}
            onNavigate={vi.fn()}
            {...props}
        />,
    );
    return { reportSent };
}

async function acceptRules() {
    fireEvent.click(
        await screen.findByRole("checkbox", {
            name: "Li e aceito as regras de cancelamento",
        }),
    );
}

const sendButton = () =>
    screen.getByRole("button", {
        name: "Enviar comprovante e avisar a produtora",
    });
const receipt = () =>
    screen.getByLabelText("Comprovante do Pix (foto ou PDF, opcional)");

describe("consumidora — avisar o pagamento do sinal", () => {
    it("sem arquivo: abre o WhatsApp da produtora com a mensagem pronta e registra o aviso", async () => {
        const { reportSent } = renderConsumer();
        await acceptRules();

        await waitFor(() => expect(sendButton()).toBeTruthy());
        fireEvent.click(sendButton());

        await screen.findByText(
            "Comprovante enviado. A produtora vai conferir o pagamento no banco.",
        );
        expect(openSpy).toHaveBeenCalledWith(
            `https://wa.me/5561999998888?text=${encodeURIComponent(MESSAGE)}`,
            "_blank",
            "noopener",
        );
        expect(reportSent).toHaveBeenCalledWith("b1");
    });

    it("com o arquivo: compartilha o comprovante pelo celular", async () => {
        const { reportSent } = renderConsumer();
        await acceptRules();
        const file = new File(["x"], "comprovante.png", { type: "image/png" });

        fireEvent.change(receipt(), { target: { files: [file] } });
        fireEvent.click(sendButton());

        await screen.findByText(
            "Comprovante enviado. A produtora vai conferir o pagamento no banco.",
        );
        expect(share).toHaveBeenCalledWith({ files: [file], text: MESSAGE });
        expect(openSpy).not.toHaveBeenCalled();
        expect(reportSent).toHaveBeenCalledTimes(1);
    });

    it("compartilhar cancelado: nada é registrado", async () => {
        share.mockRejectedValue(
            Object.assign(new Error("cancelado"), { name: "AbortError" }),
        );
        const { reportSent } = renderConsumer();
        await acceptRules();
        fireEvent.change(receipt(), {
            target: {
                files: [new File(["x"], "c.png", { type: "image/png" })],
            },
        });

        fireEvent.click(sendButton());

        await waitFor(() => expect(share).toHaveBeenCalled());
        expect(reportSent).not.toHaveBeenCalled();
    });

    it("sem telefone da produtora: orienta a mandar pelo contato combinado e registra o aviso", async () => {
        const { reportSent } = renderConsumer({
            loadProducerPhone: vi.fn().mockResolvedValue(undefined),
        });
        await acceptRules();

        expect(
            await screen.findByText(
                "Envie o comprovante para a produtora pelo contato que vocês combinaram.",
            ),
        ).toBeTruthy();
        fireEvent.click(sendButton());

        await waitFor(() => expect(reportSent).toHaveBeenCalled());
        expect(openSpy).not.toHaveBeenCalled();
    });

    it("se a API recusar, mostra o motivo", async () => {
        renderConsumer({
            reportDepositSent: vi
                .fn()
                .mockRejectedValue(
                    new BookingPaymentError(
                        "O prazo para pagar o sinal terminou. Fale com a produtora.",
                    ),
                ),
        });
        await acceptRules();

        fireEvent.click(sendButton());

        expect((await screen.findByRole("alert")).textContent).toBe(
            "O prazo para pagar o sinal terminou. Fale com a produtora.",
        );
    });
});

describe("produtora — confirmar ou contestar o sinal", () => {
    function renderProducer(status: BookingPayment["status"]) {
        const confirm = vi
            .fn()
            .mockResolvedValue({ ...payment, status: "sinal-confirmado" });
        const notFound = vi
            .fn()
            .mockResolvedValue({ ...payment, status: "aguardando-sinal" });
        render(
            <BookingDetailPage
                id="b1"
                role="producer"
                load={vi.fn().mockResolvedValue(
                    booking({
                        payment: { ...payment, status },
                        pix: undefined,
                    }),
                )}
                confirmDeposit={confirm}
                reportDepositNotFound={notFound}
                onNavigate={vi.fn()}
            />,
        );
        return { confirm, notFound };
    }

    it("confere o extrato e confirma o sinal", async () => {
        const { confirm } = renderProducer("comprovante-enviado");

        expect(
            await screen.findByText(
                "Confira no extrato do seu banco antes de confirmar.",
            ),
        ).toBeTruthy();
        fireEvent.click(
            screen.getByRole("button", { name: "Confirmar sinal" }),
        );

        expect(
            await screen.findByText("Sinal de R$ 91,00 confirmado."),
        ).toBeTruthy();
        expect(confirm).toHaveBeenCalledWith("b1");
    });

    it("não encontrou o pagamento: volta a aguardar", async () => {
        const { notFound } = renderProducer("comprovante-enviado");

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Não encontrei o pagamento",
            }),
        );

        expect(
            await screen.findByText(
                "Sinal de R$ 91,00: aguardando o pagamento da consumidora até 22/11/2026 às 10h30.",
            ),
        ).toBeTruthy();
        expect(notFound).toHaveBeenCalledWith("b1");
    });

    it("sem aviso da consumidora, só oferece confirmar", async () => {
        renderProducer("aguardando-sinal");

        expect(
            await screen.findByRole("button", { name: "Confirmar sinal" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Não encontrei o pagamento" }),
        ).toBeNull();
    });

    it.each(["sinal-confirmado", "dispensado"] as const)(
        "%s: sem botões",
        async (status) => {
            renderProducer(status);

            await screen.findByRole("heading", { level: 1 });
            expect(
                screen.queryByRole("button", { name: "Confirmar sinal" }),
            ).toBeNull();
        },
    );
});
