import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import type { Offer } from "../../shared/types";

type OfferDetailsPageProps = {
    offer: Offer;
    contactAvailable: boolean;
    onNavigate: (path: string) => void;
    onStartContact: () => void;
    backRoute?: string;
    catalogRoute?: string;
};

export function OfferDetailsPage({
    offer,
    contactAvailable,
    onNavigate,
    onStartContact,
    backRoute = "/catalogo",
    catalogRoute = "/catalogo",
}: OfferDetailsPageProps) {
    return (
        <>
            <BackButton label="Voltar" onClick={() => onNavigate(backRoute)} />
            <section className="offer-page">
                <h1>{offer.title}</h1>
                <p className="eyebrow">{offer.category}</p>
                <img
                    className="offer-image"
                    src={offer.image}
                    alt={offer.title}
                />
                <h2 className="price-heading">{offer.price}</h2>
                <div className="offer-facts">
                    {offer.details.map((detail) => (
                        <p key={detail}>{detail}</p>
                    ))}
                </div>
                <h2 className="description-heading">Descrição</h2>
                <p className="body-copy">{offer.description}</p>
                <div className="offer-actions">
                    {offer.id === "queijos" && (
                        <ActionButton
                            variant="orange"
                            onClick={() => onNavigate("/entrar")}
                        >
                            Solicitar pré-reserva
                        </ActionButton>
                    )}
                    {offer.id === "mel" && (
                        <ActionButton
                            variant="orange"
                            onClick={() => onNavigate(catalogRoute)}
                        >
                            Conhecer a Cafuringa Store
                        </ActionButton>
                    )}
                    {contactAvailable && (
                        <ActionButton
                            variant="green-soft"
                            onClick={onStartContact}
                        >
                            Conversar pelo WhatsApp
                        </ActionButton>
                    )}
                </div>
            </section>
        </>
    );
}
