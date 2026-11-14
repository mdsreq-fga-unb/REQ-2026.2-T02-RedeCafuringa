import { listExperiences } from "./catalogItems";
import { listProducts } from "./productService";
import { ProductCatalogPage } from "./ProductCatalogPage";
import { useProductCatalog } from "./useProductCatalog";

type ProductCatalogProps = {
    onNavigate: (path: string) => void;
    category?: "Produtos" | "Experiências";
};

export function ProductCatalog({
    onNavigate,
    category = "Produtos",
}: ProductCatalogProps) {
    const { status, products, retry } = useProductCatalog(
        category === "Experiências" ? listExperiences : listProducts,
    );

    return (
        <ProductCatalogPage
            category={category}
            status={status}
            products={products}
            onRetry={retry}
            onNavigate={onNavigate}
        />
    );
}
