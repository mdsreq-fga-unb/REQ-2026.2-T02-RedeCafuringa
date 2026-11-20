import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingSentPage } from "@/features/bookings/BookingSentPage";

afterEach(() => {
    cleanup();
});

const renderPage = () => {
    const props = {
        onBack: vi.fn(),
        onTrack: vi.fn(),
        onContinue: vi.fn(),
    };
    render(<BookingSentPage {...props} />);
    return props;
};

describe("BookingSentPage (HU44 CA06)", () => {
    it("informa que a solicitação foi enviada", () => {
        renderPage();
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Solicitação enviada",
            }),
        ).toBeTruthy();
    });

    it("explica que o produtor vai conferir a disponibilidade", () => {
        renderPage();
        expect(
            screen.getByText(
                "Agora o produtor vai conferir a disponibilidade para receber você.",
            ),
        ).toBeTruthy();
    });

    it("avisa que ainda não há reserva confirmada (RN19)", () => {
        renderPage();
        expect(screen.getByRole("status").textContent).toBe(
            "Você será avisado quando o status mudar. Ainda não há reserva confirmada.",
        );
    });

    it("leva ao acompanhamento da solicitação", async () => {
        const { onTrack } = renderPage();
        await userEvent.click(
            screen.getByRole("button", { name: "Acompanhar solicitação" }),
        );
        expect(onTrack).toHaveBeenCalledTimes(1);
    });

    it("permite continuar explorando", async () => {
        const { onContinue } = renderPage();
        await userEvent.click(
            screen.getByRole("button", { name: "Continuar explorando" }),
        );
        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it("volta quando o usuário aciona o Voltar", async () => {
        const { onBack } = renderPage();
        await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});