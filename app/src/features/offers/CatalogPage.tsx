import { OfferCards } from "./OfferCards";
import { useProductCatalog } from "./useProductCatalog";
import { listProducts } from "./productService";
import { listExperiences } from "./catalogItems";
import { productToOffer } from "./productOffer";
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
    const products = useProductCatalog(listProducts);
    const experiences = useProductCatalog(listExperiences);
    const ownerId = localStorage.getItem("cafuringa-user-id");
    const loaded = [...products.products, ...experiences.products]
        .filter((item) => !canRegisterProduct || item.producerId === ownerId)
        .map(productToOffer);
    const available = [
        ...new Map(
            [
                ...offers.filter(
                    (offer) =>
                        !canRegisterProduct ||
                        (offer.category.startsWith("Experi")
                            ? experiences.status !== "ready"
                            : products.status !== "ready"),
                ),
                ...loaded,
            ].map((offer) => [offer.id, offer]),
        ).values(),
    ];
    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            <section className="catalog-page product-catalog profile-catalog">
                <p className="eyebrow">
                    {canRegisterProduct
                        ? localStorage.getItem("cafuringa-name") ||
                          "Minhas ofertas"
                        : "Ofertas da região"}
                </p>
                <h1>Catálogo do perfil</h1>
                <p className="catalog-intro">
                    Produtos e experiências com a identidade de quem produz.
                </p>
                <p className="catalog-count">
                    {available.length}{" "}
                    {available.length === 1
                        ? "oferta disponível"
                        : "ofertas disponíveis"}
                </p>
                {canRegisterProduct && (
                    <button
                        className="product-submit"
                        onClick={() => onNavigate("/produtos/novo")}
                    >
                        Adicionar produto
                    </button>
                )}
                {products.status === "loading" && !available.length && (
                    <p role="status">Carregando ofertas…</p>
                )}
                {products.status === "error" && (
                    <p role="status">Não foi possível atualizar os produtos.</p>
                )}
                {!available.length && products.status === "ready" && (
                    <p role="status">
                        Você ainda não tem ofertas publicadas. Adicione sua
                        primeira oferta.
                    </p>
                )}
                <OfferCards offers={available} onNavigate={onNavigate} />
            </section>
        </>
    );
}
