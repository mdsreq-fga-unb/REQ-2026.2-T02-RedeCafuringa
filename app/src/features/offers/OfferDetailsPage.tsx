import { useState } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import { WhatsAppContactLink } from "../contact/WhatsAppContactLink";
import type { Offer } from "../../shared/types";

type OfferDetailsPageProps = {
    offer: Offer;
    /** HU39: link wa.me do contato autorizado; sem ele, não há opção de contato (CA04, CA06). */
    contactUrl?: string;
    contactLoginSubject?: string;
    producerName?: string;
    producerRoute?: string;
    onNavigate: (path: string) => void;
    onStartContact: () => void;
    /** HU44: presente quando a experiência aceita solicitações de quem está vendo. */
    onRequestBooking?: () => void;
    backPath?: string;
    backRoute?: string;
    catalogRoute?: string;
};

export function OfferDetailsPage({
    offer,
    contactUrl,
    contactLoginSubject,
    producerName,
    producerRoute,
    onNavigate,
    onStartContact,
    onRequestBooking,
    backPath,
    backRoute,
}: OfferDetailsPageProps) {
    const loginRoute = contactLoginSubject
        ? `/login/consumer?contato=${encodeURIComponent(contactLoginSubject)}`
        : undefined;
    const photos = offer.images?.length ? offer.images : [offer.image];
    const [photo, setPhoto] = useState(0);
    const producerDetail = offer.details.find((detail) =>
        /^(Produtor(?:a)?|Anfitriã(?:o)?):/.test(detail),
    );
    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate(backRoute ?? backPath ?? "/catalogo")}
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
                    {offer.details
                        .filter(
                            (detail) =>
                                !producerName || detail !== producerDetail,
                        )
                        .map((detail) => (
                            <p key={detail}>{detail}</p>
                        ))}
                </div>
                <h2 className="description-heading">Descrição</h2>
                <p className="body-copy">{offer.description}</p>
                <div className="offer-actions">
                    {onRequestBooking && (
                        <ActionButton
                            variant="orange"
                            onClick={onRequestBooking}
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
                </div>
                {(producerName ||
                    producerRoute ||
                    contactUrl ||
                    loginRoute) && (
                    <section
                        className="public-contact-card"
                        aria-labelledby="offer-contact-heading"
                    >
                        <div>
                            <h2 id="offer-contact-heading">
                                Contato com a produtora
                            </h2>
                            {producerName && (
                                <p className="contact-name">
                                    {producerDetail ?? producerName}
                                </p>
                            )}
                            {loginRoute ? (
                                <p>
                                    Entre na sua conta para conversar com a
                                    produtora pelo WhatsApp.
                                </p>
                            ) : (
                                !contactUrl && (
                                    <p>
                                        WhatsApp indisponível para esta oferta.
                                    </p>
                                )
                            )}
                        </div>
                        <div className="public-contact-actions">
                            {loginRoute ? (
                                <a
                                    className="button button-orange"
                                    href={`#${loginRoute}`}
                                >
                                    Entrar para conversar
                                </a>
                            ) : (
                                contactUrl && (
                                    <WhatsAppContactLink url={contactUrl} />
                                )
                            )}
                            {producerRoute && (
                                <a
                                    className="button button-outline"
                                    href={`#${producerRoute}`}
                                    onClick={(event) => {
                                        if (
                                            event.metaKey ||
                                            event.ctrlKey ||
                                            event.shiftKey ||
                                            event.altKey
                                        )
                                            return;
                                        event.preventDefault();
                                        onNavigate(producerRoute);
                                    }}
                                >
                                    Ver perfil da produtora{" "}
                                    <span aria-hidden="true">→</span>
                                </a>
                            )}
                        </div>
                    </section>
                )}
            </section>
        </>
    );
}
