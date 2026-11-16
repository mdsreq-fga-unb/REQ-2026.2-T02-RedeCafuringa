import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfferDetailsPage, offers } from "@/features/offers";

afterEach(cleanup);

const mel = offers.find((offer) => offer.id === "mel");
if (!mel) throw new Error("oferta mel não encontrada");

function renderDetails(
    props: Partial<ComponentProps<typeof OfferDetailsPage>> = {},
) {
    const onNavigate = vi.fn();
    render(
        <OfferDetailsPage
            offer={mel!}
            contactAvailable={false}
            onNavigate={onNavigate}
            onStartContact={vi.fn()}
            {...props}
        />,
    );
    return { onNavigate };
}

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

    it("volta para o catálogo do perfil por padrão", () => {
        const { onNavigate } = renderDetails();

        fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

        expect(onNavigate).toHaveBeenCalledWith("/catalogo");
    });

    it("volta para o caminho informado em backPath", () => {
        const { onNavigate } = renderDetails({ backPath: "/produtos" });

        fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

        expect(onNavigate).toHaveBeenCalledWith("/produtos");
    });
});
