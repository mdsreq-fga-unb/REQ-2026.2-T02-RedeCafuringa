import { mockApiProducts } from "./mockProducts";
import { toProductList } from "./productAdapter";
import { toProductDetails } from "./productDetailsAdapter";
import type { Product, ProductDetails } from "./productTypes";

export function listMockProducts(): Promise<Product[]> {
    return Promise.resolve(toProductList(mockApiProducts));
}

export function getMockProductById(
    id: string,
): Promise<ProductDetails | null> {
    const item = mockApiProducts.find((product) => product.id === id);
    return Promise.resolve(item ? toProductDetails(item) : null);
}