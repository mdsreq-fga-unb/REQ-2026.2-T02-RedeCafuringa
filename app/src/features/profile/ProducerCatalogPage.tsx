import { whatsAppContactUrl } from "@/features/contact";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";
import { OfferCards } from "@/features/offers/OfferCards";
import {
    offerDetailsRoute,
    offerReturnRoute,
} from "@/features/offers/offerNavigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { OfferDetailsPage } from "@/features/offers";
import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import { listProducerOffers } from "./publicProfileService";
import type { ProducerOffer } from "./publicProfileService";

export function ProducerCatalogPage({
    profile,
    offerId,
    onNavigate,
    contactPhone,
    canViewContact = false,
}: {
    profile: PublicTrajectory;
    offerId?: string;
    onNavigate: (path: string) => void;
    /** HU39: telefone público (autorizado) do perfil, reaproveitado nas ofertas dele. */
    contactPhone?: string;
    canViewContact?: boolean;
}) {
    const [offers, setOffers] = useState<ProducerOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const profileRoute = `/produtor/${encodeURIComponent(profile.id)}`;
    const catalogRoute = `${profileRoute}?catalogo=1`;
    useEffect(() => {
        const controller = new AbortController();
        void listProducerOffers(profile.id, controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setOffers(data);
            })
            .catch(() => {
                if (!controller.signal.aborted) setError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [profile.id, attempt]);
    const selected = offers.find((offer) => offer.id === offerId);
    if (selected?.category.startsWith("Produto"))
        return (
            <ProductOfferDetails
                id={selected.id}
                canViewContact={canViewContact}
                backPath={offerReturnRoute(
                    window.location.hash.slice(1),
                    catalogRoute,
                )}
                onNavigate={onNavigate}
            />
        );
    if (selected)
        return (
            <OfferDetailsPage
                offer={selected}
                producerName={profile.nomeIniciativa}
                producerRoute={profileRoute}
                contactUrl={whatsAppContactUrl(contactPhone, selected.title, {
                    kind: "experience",
                    route: offerDetailsRoute(selected.id, true),
                })}
                onNavigate={onNavigate}
                backRoute={offerReturnRoute(
                    window.location.hash.slice(1),
                    catalogRoute,
                )}
                catalogRoute={catalogRoute}
            />
        );
    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate(profileRoute)}
            />
            <section className="catalog-page producer-catalog product-catalog profile-catalog">
                <p className="eyebrow">
                    {profile.nomeIniciativa || "Produtora"}
                </p>
                <h1>Catálogo do perfil</h1>
                <p className="catalog-intro">
                    Conheça os sabores e as vivências desta iniciativa.
                </p>
                {!loading && !error && (
                    <p className="catalog-count">
                        {offers.length}{" "}
                        {offers.length === 1
                            ? "oferta disponível"
                            : "ofertas disponíveis"}
                    </p>
                )}
                {loading && <p role="status">Carregando ofertas…</p>}
                {error && (
                    <div role="alert">
                        <p>
                            Não foi possível carregar as ofertas desta
                            produtora.
                        </p>
                        <ActionButton
                            variant="outline"
                            onClick={() => {
                                setLoading(true);
                                setError(false);
                                setAttempt((value) => value + 1);
                            }}
                        >
                            Tentar novamente
                        </ActionButton>
                    </div>
                )}
                {!loading && !error && offerId && !selected && (
                    <p role="alert">
                        Oferta indisponível ou não encontrada neste perfil.
                    </p>
                )}
                {!loading && !error && offers.length === 0 && (
                    <p role="status">
                        Esta produtora ainda não tem ofertas disponíveis.
                    </p>
                )}
                <OfferCards
                    offers={offers}
                    onNavigate={onNavigate}
                    routeFor={(offer) =>
                        `${catalogRoute}&oferta=${encodeURIComponent(offer.id)}`
                    }
                />
            </section>
        </>
    );
}
