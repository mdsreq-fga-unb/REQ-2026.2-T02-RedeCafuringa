import { getApiClient, type ApiClient } from "@/shared/api";
import { toProductList } from "./productAdapter";
import type { ApiProduct, Product } from "./productTypes";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { listMockProducts } from "./mockProductService";

export function listProducts(): Promise<Product[]> {
    return isMockAuthEnabled ? listMockProducts() : fetchProducts();
}

export async function fetchProducts(
    client: ApiClient = getApiClient(),
): Promise<Product[]> {
    const items = await client.get<ApiProduct[]>("/products", {
        auth: false,
    });
    return toProductList(items);
}