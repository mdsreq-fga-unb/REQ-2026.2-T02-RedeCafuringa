import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfferDetailsPage, offers } from "@/features/offers";

afterEach(cleanup);

describe("detalhes da oferta", () => {
    it.each(offers)(
        "oculta o contato não autorizado na oferta $title",
        (offer) => {
            render(
                <OfferDetailsPage
                    offer={offer}
                    contactAvailable={false}
                    onNavigate={vi.fn()}
                    onStartContact={vi.fn()}
                />,
            );

            expect(
                screen.queryByRole("button", {
                    name: "Conversar pelo WhatsApp",
                }),
            ).toBeNull();
        },
    );

    it.each(offers)(
        "disponibiliza o contato autorizado na oferta $title",
        (offer) => {
            const onStartContact = vi.fn();
            render(
                <OfferDetailsPage
                    offer={offer}
                    contactAvailable
                    onNavigate={vi.fn()}
                    onStartContact={onStartContact}
                />,
            );

            fireEvent.click(
                screen.getByRole("button", {
                    name: "Conversar pelo WhatsApp",
                }),
            );

            expect(onStartContact).toHaveBeenCalledOnce();
        },
    );
});
