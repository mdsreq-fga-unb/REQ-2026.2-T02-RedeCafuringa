import type { Ref } from "react";
import type { Offer } from "@/shared/types";
import { offerDetailsRoute } from "./offerNavigation";

const RESPONSIBLE = /^(Produtor(?:a)?|Anfitriã(?:o)?):\s*/;

/**
 * HU24 CA07: primeira informação do card, em geral o responsável ("Produtora:"
 * ou "Anfitriã:", sem o rótulo). Quando o nome não foi informado, a linha não
 * aparece, em vez de um rótulo vazio.
 */
function responsibleOf(offer: Offer): string | undefined {
    return offer.details[0]?.replace(RESPONSIBLE, "").trim() || undefined;
}

export function OfferCards({
    offers,
    onNavigate,
    listRef,
    routeFor = (offer) =>
        offerDetailsRoute(offer.id, offer.category.startsWith("Experi")),
}: {
    offers: Offer[];
    onNavigate: (path: string) => void;
    listRef?: Ref<HTMLUListElement>;
    routeFor?: (offer: Offer) => string;
}) {
    return (
        <ul className="offer-list product-list" ref={listRef}>
            {offers.map((offer, index) => {
                const responsible = responsibleOf(offer);
                // RNF06: a foto do primeiro card é o maior conteúdo da tela
                // (LCP); carregá-la de imediato evita esperar o lazy loading.
                const first = index === 0;
                return (
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
                                {responsible && (
                                    <span className="product-producer">
                                        {responsible}
                                    </span>
                                )}
                                <span className="product-price">
                                    {offer.price}
                                </span>
                                <span className="card-action">
                                    Conhecer <span aria-hidden="true">→</span>
                                </span>
                            </span>
                            <img
                                src={offer.image || "/folha-logo.svg"}
                                alt=""
                                loading={first ? "eager" : "lazy"}
                                fetchPriority={first ? "high" : undefined}
                                decoding="async"
                                onError={(event) => {
                                    if (
                                        !event.currentTarget.src.endsWith(
                                            "/folha-logo.svg",
                                        )
                                    )
                                        event.currentTarget.src =
                                            "/folha-logo.svg";
                                }}
                            />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
