import { useState } from "react";
import { BackButton } from "../../components/navigation/BackButton";
import { ActionButton } from "../../components/ui/ActionButton";
import { formatProductPrice } from "./productPrice";
import { filterProducts } from "./productSearch";
import type { Product } from "./productTypes";
import type { CatalogStatus } from "./useProductCatalog";

type ProductCatalogPageProps = {
    products: Product[];
    status?: CatalogStatus;
    onRetry?: () => void;
    onNavigate: (path: string) => void;
};

export function ProductCatalogPage({
    products,
    status = "ready",
    onRetry,
    onNavigate,
}: ProductCatalogPageProps) {
    const [query, setQuery] = useState("");
    const visibleProducts = filterProducts(products, query);

    return (
        <>
            <BackButton label="Voltar" onClick={() => onNavigate("/perfil")} />
            <section className="catalog-page">
                <h1>Catálogo de Produtos</h1>
                {status === "loading" && (
                    <p role="status">Carregando produtos...</p>
                )}
                {status === "error" && (
                    <div role="alert">
                        <p>Não foi possível carregar os produtos.</p>
                        {onRetry && (
                            <ActionButton variant="orange" onClick={onRetry}>
                                Tentar novamente
                            </ActionButton>
                        )}
                    </div>
                )}
                {status === "ready" && products.length === 0 && (
                    <p>Não há ofertas disponíveis no momento.</p>
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
                                aria-label="Buscar produtos"
                                placeholder="Buscar produtos"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                            />
                        </div>
                        {visibleProducts.length === 0 ? (
                            <p>Nenhum produto encontrado.</p>
                        ) : (
                            <ul className="offer-list product-list">
                                {visibleProducts.map((product) => (
                                    <li key={product.id}>
                                        <button
                                            className="offer-card product-card"
                                            type="button"
                                            onClick={() =>
                                                onNavigate(
                                                    `/oferta/${product.id}`,
                                                )
                                            }
                                        >
                                            <img src={product.image} alt="" />
                                            <span className="offer-card-copy">
                                                <small>Produto</small>
                                                <strong>{product.name}</strong>
                                                <span>
                                                    {product.producerName}
                                                </span>
                                                <span className="product-price">
                                                    {formatProductPrice(
                                                        product.price,
                                                        product.unit,
                                                    )}
                                                </span>
                                                <span className="card-action">
                                                    Conhecer{" "}
                                                    <span aria-hidden="true">
                                                        →
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
