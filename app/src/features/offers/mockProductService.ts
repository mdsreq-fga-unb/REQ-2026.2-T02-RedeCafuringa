import { readDemoOffers } from "./publishedOffers";
import { registeredToCatalogItem } from "./catalogItems";
import { mockApiProducts } from "./mockProducts";
import { toProductList } from "./productAdapter";
import { toProductDetails } from "./productDetailsAdapter";
import type { Product, ProductDetails } from "./productTypes";

// No demo as fotos já são URLs completas; apiResourceUrl só aceita caminhos
// relativos à API.
const demoPhoto = (foto: string) => foto;

export function listMockProducts(): Promise<Product[]> {
    return Promise.resolve([
        ...readDemoOffers()
            .filter(
                (item) =>
                    "precoPorUnidade" in item && item.disponivel !== false,
            )
            .map(registeredToCatalogItem),
        ...toProductList(mockApiProducts, demoPhoto),
    ]);
}

export function getMockProductById(
    id: string,
): Promise<ProductDetails | null> {
    const item = mockApiProducts.find((product) => product.id === id);
    return Promise.resolve(item ? toProductDetails(item) : null);
}