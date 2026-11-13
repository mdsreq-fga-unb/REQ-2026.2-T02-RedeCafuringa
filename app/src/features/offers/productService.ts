import { ApiHttpError, getApiClient, type ApiClient } from "@/shared/api";
import { toProductList } from "./productAdapter";
import { toProductDetails } from "./productDetailsAdapter";
import type {
    ApiProduct,
    ApiProductDetails,
    Product,
    ProductDetails,
} from "./productTypes";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { getMockProductById, listMockProducts } from "./mockProductService";

export function listProducts(): Promise<Product[]> {
    return isMockAuthEnabled ? listMockProducts() : fetchProducts();
}

export function getProductById(id: string): Promise<ProductDetails | null> {
    return isMockAuthEnabled ? getMockProductById(id) : fetchProductById(id);
}

export async function fetchProducts(
    client: ApiClient = getApiClient(),
): Promise<Product[]> {
    const items = await client.get<ApiProduct[]>("/products", {
        auth: false,
    });
    return toProductList(items);
}

export async function fetchProductById(
    id: string,
    client: ApiClient = getApiClient(),
): Promise<ProductDetails | null> {
    try {
        const item = await client.get<ApiProductDetails>(
            `/products/${encodeURIComponent(id)}`,
            { auth: false },
        );
        return toProductDetails(item);
    } catch (error) {
        if (error instanceof ApiHttpError && error.status === 404) {
            return null;
        }
        throw error;
    }
}