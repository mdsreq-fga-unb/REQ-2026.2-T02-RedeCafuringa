import { BackButton } from "../../components/navigation/BackButton";
import { formatProductPrice } from "./productPrice";
import type { Product } from "./productTypes";

type ProductCatalogPageProps = {
    products: Product[];
    onNavigate: (path: string) => void;
};

export function ProductCatalogPage({
    products,
    onNavigate,
}: ProductCatalogPageProps) {
    return (
        <>
            <BackButton label="Voltar" onClick={() => onNavigate("/perfil")} />
            <section className="catalog-page">
                <h1>Catálogo de Produtos</h1>
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
            </section>
        </>
    );
}