import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingFormPage } from "@/features/bookings/BookingFormPage";

vi.mock("@/features/bookings/bookingService", () => ({
    createBooking: vi.fn(),
}));

afterEach(() => {
    cleanup();
    localStorage.clear();
});

const experience = {
    id: "e1",
    name: "Trilha",
    producerName: "Maria",
    local: "Sítio",
    duracao: "2 horas",
    price: 45.5,
};

describe("solicitação — aviso do sinal", () => {
    it("ao escolher participantes e pagamento, mostra o sinal e o restante", async () => {
        const user = userEvent.setup();
        render(
            <BookingFormPage
                experience={{ ...experience, requiresDeposit: true }}
                onBack={vi.fn()}
                onSent={vi.fn()}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: "Aumentar participantes" }),
        );
        await user.selectOptions(
            screen.getByLabelText(/^Forma de pagamento/),
            "dinheiro",
        );

        expect(
            screen.getByText(
                "Se a produtora aceitar, você terá 24 horas para pagar o sinal de 50% (R$ 22,75) por Pix e garantir a vaga. O restante (R$ 22,75) você paga em dinheiro no dia.",
            ),
        ).toBeTruthy();
    });

    it("experiência sem sinal: avisa que paga tudo no dia", async () => {
        const user = userEvent.setup();
        render(
            <BookingFormPage
                experience={{ ...experience, requiresDeposit: false }}
                onBack={vi.fn()}
                onSent={vi.fn()}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: "Aumentar participantes" }),
        );

        expect(
            screen.getByText(
                "Esta experiência não pede sinal. Você paga R$ 45,50 no dia, com a produtora.",
            ),
        ).toBeTruthy();
    });
});
