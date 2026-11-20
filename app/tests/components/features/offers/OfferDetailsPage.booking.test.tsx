import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfferDetailsPage } from "@/features/offers/OfferDetailsPage";
import type { Offer } from "@/shared/types";

afterEach(() => {
    cleanup();
});

const offer = (id: string): Offer => ({
    id,
    title: "Trilha guiada da nascente",
    category: "Experiências",
    image: "",
    price: "R$ 45,00 / pessoa",
    details: ["Produtor: Jefferson Sooma"],
    description: "Caminhada até a nascente.",
});

const renderPage = (id: string, onRequestBooking?: () => void) =>
    render(
        <OfferDetailsPage
            offer={offer(id)}
            contactAvailable={false}
            onNavigate={vi.fn()}
            onStartContact={vi.fn()}
            onRequestBooking={onRequestBooking}
        />,
    );

const bookingButton = () =>
    screen.queryByRole("button", { name: "Solicitar pré-reserva" });

describe("OfferDetailsPage: pré-reserva (HU44 CA01)", () => {
    it("mostra o botão e chama a pré-reserva quando ela está disponível", async () => {
        const onRequestBooking = vi.fn();
        renderPage("trilha", onRequestBooking);
        await userEvent.click(bookingButton() as HTMLElement);
        expect(onRequestBooking).toHaveBeenCalledTimes(1);
    });

    it("não mostra o botão quando a pré-reserva não está disponível", () => {
        renderPage("trilha");
        expect(bookingButton()).toBeNull();
    });

    it("não depende mais do id da oferta de demonstração", () => {
        renderPage("queijos");
        expect(bookingButton()).toBeNull();
    });
});
