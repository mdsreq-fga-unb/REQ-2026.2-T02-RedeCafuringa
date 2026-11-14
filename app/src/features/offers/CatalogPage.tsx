import { BackButton } from "../../components/navigation/BackButton";
import type { Offer } from "../../shared/types";

type CatalogPageProps = {
    offers: Offer[];
    onNavigate: (path: string) => void;
    canRegisterProduct?: boolean;
};

export function CatalogPage({
    offers,
    onNavigate,
    canRegisterProduct = false,
}: CatalogPageProps) {
    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            <section className="catalog-page">
                <p className="eyebrow">Dona Maria</p>
                <h1>Catálogo do perfil</h1>
                {canRegisterProduct && (
                    <button
                        className="product-submit"
                        onClick={() => onNavigate("/produtos/novo")}
                    >
                        Adicionar produto
                    </button>
                )}
                <div className="offer-list">
                    {offers.map((offer) => (
                        <button
                            className="offer-card"
                            key={offer.id}
                            onClick={() => onNavigate(`/oferta/${offer.id}`)}
                        >
                            <img src={offer.image} alt="" />
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
