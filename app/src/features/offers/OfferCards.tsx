import type { Offer } from "@/shared/types";

export function OfferCards({
    offers,
    onNavigate,
    routeFor = (offer) =>
        `/oferta/${encodeURIComponent(offer.id)}${offer.category.startsWith("Experi") ? "?tipo=experiencia" : ""}`,
}: {
    offers: Offer[];
    onNavigate: (path: string) => void;
    routeFor?: (offer: Offer) => string;
}) {
    return (
        <ul className="offer-list product-list">
            {offers.map((offer) => (
                <li key={offer.id}>
                    <button
                        className="offer-card product-card"
                        type="button"
                        onClick={() => onNavigate(routeFor(offer))}
                    >
                        <span className="offer-card-copy">
                            <small>
                                {offer.category.startsWith("Experi")
                                    ? "Experiência"
                                    : "Produto"}
                            </small>
                            <strong>{offer.title}</strong>
                            <span className="product-producer">
                                {offer.details[0]?.replace(
                                    /^(Produtor|Anfitrião):\s*/,
                                    "",
                                )}
                            </span>
                            <span className="product-price">{offer.price}</span>
                            <span className="card-action">
                                Conhecer <span aria-hidden="true">→</span>
                            </span>
                        </span>
                        <img
                            src={offer.image || "/folha-logo.svg"}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={(event) => {
                                if (
                                    !event.currentTarget.src.endsWith(
                                        "/folha-logo.svg",
                                    )
                                )
                                    event.currentTarget.src = "/folha-logo.svg";
                            }}
                        />
                    </button>
                </li>
            ))}
        </ul>
    );
}
