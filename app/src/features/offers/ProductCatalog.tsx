import { ProductCatalogPage } from "./ProductCatalogPage";
import { useProductCatalog } from "./useProductCatalog";

type ProductCatalogProps = {
    onNavigate: (path: string) => void;
};

export function ProductCatalog({ onNavigate }: ProductCatalogProps) {
    const { status, products, retry } = useProductCatalog();

    return (
        <ProductCatalogPage
            status={status}
            products={products}
            onRetry={retry}
            onNavigate={onNavigate}
        />
    );
}