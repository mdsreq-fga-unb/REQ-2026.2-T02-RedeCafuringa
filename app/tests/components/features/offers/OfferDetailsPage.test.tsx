import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfferDetailsPage, offers } from "@/features/offers";

afterEach(cleanup);

const mel = offers.find((offer) => offer.id === "mel");
if (!mel) throw new Error("oferta mel não encontrada");

const CONTACT = /Conversar pelo WhatsApp/;
const url = "https://wa.me/5561999998888?text=Ol%C3%A1";

function renderDetails(
    props: Partial<ComponentProps<typeof OfferDetailsPage>> = {},
) {
    const onNavigate = vi.fn();
    render(
        <OfferDetailsPage offer={mel!} onNavigate={onNavigate} {...props} />,
    );
    return { onNavigate };
}

describe("detalhes da oferta", () => {
    it.each(offers)(
        "CA04/CA06: sem contato autorizado não há opção de contato na oferta $title",
        (offer) => {
            render(<OfferDetailsPage offer={offer} onNavigate={vi.fn()} />);

            expect(screen.queryByRole("link", { name: CONTACT })).toBeNull();
            expect(screen.queryByRole("button", { name: CONTACT })).toBeNull();
        },
    );

    it.each(offers)(
        "CA01/CA02: disponibiliza o contato autorizado na oferta $title",
        (offer) => {
            render(
                <OfferDetailsPage
                    offer={offer}
                    contactUrl={url}
                    onNavigate={vi.fn()}
                />,
            );

            const link = screen.getByRole("link", { name: CONTACT });
            expect(link.getAttribute("href")).toBe(url);
            expect(link.getAttribute("target")).toBe("_blank");
        },
    );

    it("RN17: visitante vê a opção como botão que leva ao login", () => {
        const onContactRequiresLogin = vi.fn();
        renderDetails({ contactUrl: url, onContactRequiresLogin });

        expect(screen.queryByRole("link", { name: CONTACT })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: CONTACT }));
        expect(onContactRequiresLogin).toHaveBeenCalledOnce();
    });

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
