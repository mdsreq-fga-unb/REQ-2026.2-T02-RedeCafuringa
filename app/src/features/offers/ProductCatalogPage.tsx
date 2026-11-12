import { BackButton } from "../../components/navigation/BackButton";
import { formatProductPrice } from "./productPrice";
import type { Product } from "./productTypes";
import { ActionButton } from "../../components/ui/ActionButton";

type ProductCatalogPageProps = {
    products: Product[];
    status?: "loading" | "ready" | "error";
    onRetry?: () => void;
    onNavigate: (path: string) => void;
};

export function ProductCatalogPage({
    products,
    status = "ready",
    onRetry,
    onNavigate,
}: ProductCatalogPageProps) {
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
                    <ul className="offer-list">
                        {products.map((product) => (
                        <li key={product.id}>
                            <button
                                className="offer-card"
                                type="button"
                                onClick={() =>
                                    onNavigate(`/oferta/${product.id}`)
                                }
                            >
                                <img src={product.image} alt="" />
                                <span className="offer-card-copy">
                                    <small>Produto</small>
                                    <strong>{product.name}</strong>
                                    <span>{product.producerName}</span>
                                    <span>
                                        {formatProductPrice(
                                            product.price,
                                            product.unit,
                                        )}
                                    </span>
                                    <span className="card-action">
                                        Conhecer{" "}
                                        <span aria-hidden="true">→</span>
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))} 
                    </ul>
                )}
            </section>
        </>
    );
}

