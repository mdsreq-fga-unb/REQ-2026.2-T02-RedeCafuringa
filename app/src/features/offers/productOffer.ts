import type { Offer } from "@/shared/types";
import { formatProductPrice } from "./productPrice";
import type { Product } from "./productTypes";

export function productToOffer(product: Product): Offer {
    return {
        id: product.id,
        title: product.name,
        category: product.category ?? "Produtos",
        image: product.image,
        price: formatProductPrice(product.price, product.unit),
        details: [
            `Produtor: ${product.producerName}`,
            ...[product.local, product.duracao].filter(
                (value): value is string => !!value,
            ),
        ],
        description:
            product.description ??
            "Consulte disponibilidade e formas de retirada diretamente com o produtor.",
    };
}
