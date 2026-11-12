import type { Product } from "./productTypes";

function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function filterProducts(
    products: Product[],
    query: string,
): Product[] {
    const term = normalize(query);
    if (!term) return products;
    return products.filter(
        (product) =>
            normalize(product.name).includes(term) ||
            normalize(product.producerName).includes(term),
    );
}