import { useState } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import type { Offer } from "../../shared/types";

type OfferDetailsPageProps = {
    offer: Offer;
    contactAvailable: boolean;
    backPath?: string;
    onNavigate: (path: string) => void;
    onStartContact: () => void;
    backRoute?: string;
    catalogRoute?: string;
};

export function OfferDetailsPage({
    offer,
    contactAvailable,
    backPath = "/catalogo",
    onNavigate,
    onStartContact,
    backRoute,
}: OfferDetailsPageProps) {
    const photos = offer.images?.length ? offer.images : [offer.image];
    const [photo, setPhoto] = useState(0);
    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate(backRoute ?? backPath)}
            />
            <section className="offer-page">
                <h1>{offer.title}</h1>
                <p className="eyebrow">{offer.category}</p>
                <img
                    className="offer-image"
                    src={photos[photo] || "/folha-logo.svg"}
                    decoding="async"
                    onError={(event) => {
                        if (
                            !event.currentTarget.src.endsWith("/folha-logo.svg")
                        )
                            event.currentTarget.src = "/folha-logo.svg";
                    }}
                    alt={offer.title}
                />
                {photos.length > 1 && (
                    <div
                        className="offer-gallery"
                        role="group"
                        aria-label="Fotos do produto"
                    >
                        {photos.map((image, index) => (
                            <button
                                type="button"
                                key={`${image}-${index}`}
                                aria-label={`Ver foto ${index + 1} de ${offer.title}`}
                                aria-pressed={index === photo}
                                onClick={() => setPhoto(index)}
                            >
                                <img src={image} alt="" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}
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
                    {offer.category.startsWith("Produto") && (
                        <a
                            className="button button-orange"
                            href="https://cafuringa.store/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Conhecer a Cafuringa Store
                        </a>
                    )}
                    {contactAvailable && (
                        <ActionButton variant="green" onClick={onStartContact}>
                            Conversar pelo WhatsApp
                        </ActionButton>
                    )}
                </div>
            </section>
        </>
    );
}
