import { useState } from "react";
import { BackButton } from "../../components/navigation/BackButton";
import { ActionButton } from "../../components/ui/ActionButton";
import { OfferCards } from "./OfferCards";
import { productToOffer } from "./productOffer";
import { filterProducts } from "./productSearch";
import type { Product } from "./productTypes";
import type { CatalogStatus } from "./useProductCatalog";

type ProductCatalogPageProps = {
    products: Product[];
    category?: "Produtos" | "Experiências";
    status?: CatalogStatus;
    onRetry?: () => void;
    onNavigate: (path: string) => void;
};

export function ProductCatalogPage({
    products,
    status = "ready",
    category = "Produtos",
    onRetry,
    onNavigate,
}: ProductCatalogPageProps) {
    const experiences = category === "Experiências";
    const [query, setQuery] = useState("");
    const visibleProducts = filterProducts(products, query);

    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            <section
                className="catalog-page product-catalog"
                aria-labelledby="product-catalog-title"
                aria-busy={status === "loading"}
            >
                <h1 id="product-catalog-title">Catálogo de {category}</h1>
                {status === "loading" && (
                    <p role="status">
                        {experiences
                            ? "Carregando experiências..."
                            : "Carregando produtos..."}
                    </p>
                )}
                {status === "error" && (
                    <div role="alert">
                        <p>
                            {experiences
                                ? "Não foi possível carregar as experiências. A consulta pode estar indisponível no servidor."
                                : "Não foi possível carregar os produtos."}
                        </p>
                        {onRetry && (
                            <ActionButton variant="orange" onClick={onRetry}>
                                Tentar novamente
                            </ActionButton>
                        )}
                    </div>
                )}
                {status === "ready" && products.length === 0 && (
                    <p role="status">Não há ofertas disponíveis no momento.</p>
                )}
                {status === "ready" && products.length > 0 && (
                    <>
                        <div role="search" className="product-search">
                            <svg
                                className="product-search-icon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                            <input
                                type="search"
                                aria-label={
                                    experiences
                                        ? "Buscar experiências"
                                        : "Buscar produtos"
                                }
                                placeholder={
                                    experiences
                                        ? "Buscar experiências"
                                        : "Buscar produtos e experiências"
                                }
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                            />
                        </div>
                        {visibleProducts.length === 0 ? (
                            <p role="status">
                                {experiences
                                    ? "Nenhuma experiência encontrada."
                                    : "Nenhum produto encontrado."}
                            </p>
                        ) : (
                            <OfferCards
                                offers={visibleProducts.map(productToOffer)}
                                onNavigate={onNavigate}
                            />
                        )}
                    </>
                )}
            </section>
        </>
    );
}
