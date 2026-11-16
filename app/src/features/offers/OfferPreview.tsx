import { useProductCatalog } from "./useProductCatalog";
import { listProducts } from "./productService";
import { listExperiences } from "./catalogItems";
import { filterProducts } from "./productSearch";
import { productToOffer } from "./productOffer";
import { OfferCards } from "./OfferCards";

export function OfferPreview({
    category,
    query,
    onNavigate,
}: {
    category: string;
    query: string;
    onNavigate: (path: string) => void;
}) {
    const experience = category === "Experiências";
    const { products, status, retry } = useProductCatalog(
        experience ? listExperiences : listProducts,
    );
    const visible = filterProducts(products, query).slice(0, 2);
    return (
        <section
            className="explore-offers"
            aria-label={
                experience ? "Prévia de experiências" : "Prévia de produtos"
            }
        >
            <h2 className="explore-heading">
                {experience
                    ? "Experiências para viver"
                    : "Produtos da nossa região"}
            </h2>
            {status === "loading" && (
                <p role="status">Carregando {category.toLowerCase()}…</p>
            )}
            {status === "error" && (
                <div>
                    <p role="status">
                        Não foi possível carregar {category.toLowerCase()}.
                    </p>
                    <button className="text-action" onClick={retry}>
                        Tentar carregar {category.toLowerCase()}
                    </button>
                </div>
            )}
            {status === "ready" && !visible.length && (
                <p role="status">Nenhuma oferta encontrada nesta categoria.</p>
            )}
            <OfferCards
                offers={visible.map(productToOffer)}
                onNavigate={onNavigate}
            />
            <button
                className="catalog-more"
                onClick={() =>
                    onNavigate(experience ? "/experiencias" : "/produtos")
                }
            >
                {experience ? "Ver mais experiências" : "Ver mais produtos"}{" "}
                <span aria-hidden="true">→</span>
            </button>
        </section>
    );
}
