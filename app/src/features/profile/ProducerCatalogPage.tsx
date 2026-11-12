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
    onStartContact,
    contactAvailable,
}: {
    profile: PublicTrajectory;
    offerId?: string;
    onNavigate: (path: string) => void;
    onStartContact: () => void;
    contactAvailable: boolean;
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
    if (selected)
        return (
            <OfferDetailsPage
                offer={selected}
                contactAvailable={contactAvailable}
                onStartContact={onStartContact}
                onNavigate={onNavigate}
                backRoute={catalogRoute}
                catalogRoute={catalogRoute}
            />
        );
    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate(profileRoute)}
            />
            <section className="catalog-page producer-catalog">
                <p className="eyebrow">
                    {profile.nomeIniciativa || "Produtor"}
                </p>
                <h1>Catálogo do perfil</h1>
                {loading && <p role="status">Carregando ofertas…</p>}
                {error && (
                    <div role="alert">
                        <p>
                            Não foi possível carregar as ofertas deste produtor.
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
                        Este produtor ainda não tem ofertas disponíveis.
                    </p>
                )}
                <div className="offer-list">
                    {offers.map((offer) => (
                        <button
                            key={offer.id}
                            className="offer-card"
                            onClick={() =>
                                onNavigate(
                                    `${catalogRoute}&oferta=${encodeURIComponent(offer.id)}`,
                                )
                            }
                        >
                            {offer.image && (
                                <img src={offer.image} alt="" loading="lazy" />
                            )}
                            <span className="offer-card-copy">
                                <small>{offer.category}</small>
                                <strong>{offer.title}</strong>
                                <span>{offer.price}</span>
                            </span>
                            <span className="card-arrow" aria-hidden="true">
                                →
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </>
    );
}
