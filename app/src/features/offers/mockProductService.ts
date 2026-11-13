import { mockApiProducts } from "./mockProducts";
import { toProductList } from "./productAdapter";
import type { Product } from "./productTypes";

export function listMockProducts(): Promise<Product[]> {
    return Promise.resolve(toProductList(mockApiProducts));
}
