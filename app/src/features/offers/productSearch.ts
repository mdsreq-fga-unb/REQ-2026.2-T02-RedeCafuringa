import type { Product } from "./productTypes";

export function normalizeSearchText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function filterProducts(products: Product[], query: string): Product[] {
    const term = normalizeSearchText(query);
    if (!term) return products;
    return products.filter(
        (product) =>
            normalizeSearchText(product.name).includes(term) ||
            normalizeSearchText(product.producerName).includes(term),
    );
}
