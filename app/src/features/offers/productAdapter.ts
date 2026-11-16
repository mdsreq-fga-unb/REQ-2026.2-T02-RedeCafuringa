import type { ApiProduct, Product } from "./productTypes";

export function toProductList(items: ApiProduct[]): Product[] {
    return items
        .filter((item) => item.disponivel)
        .map((item) => ({
            id: item.id,
            name: item.nome,
            producerName: item.produtor,
            price: item.preco,
            unit: item.unidade,
            image: item.imagemUrl,
        }));
}
