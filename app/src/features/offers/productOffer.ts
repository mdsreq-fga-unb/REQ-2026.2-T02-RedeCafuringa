import type { Offer } from "@/shared/types";
import { formatProductPrice } from "./productPrice";
import type { Product } from "./productTypes";

export function productToOffer(product: Product): Offer {
    // Experiência (HU21/HU24, protótipo): Anfitrião, Duração e Local, uma vez cada.
    const experience =
        product.local !== undefined || product.duracao !== undefined;
    return {
        id: product.id,
        title: product.name,
        category: product.category ?? "Produtos",
        image: product.image,
        ...(product.photos ? { images: product.photos } : {}),
        price: formatProductPrice(product.price, product.unit),
        details: experience
            ? [
                  `Anfitrião: ${product.producerName}`,
                  ...(product.duracao ? [`Duração: ${product.duracao}`] : []),
                  ...(product.local || product.producerLocation
                      ? [`Local: ${product.local || product.producerLocation}`]
                      : []),
              ]
            : [
                  `Produtor: ${product.producerName}`,
                  ...(product.producerLocation
                      ? [`Propriedade: ${product.producerLocation}`]
                      : []),
                  ...(product.grams !== undefined
                      ? [
                            `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(product.grams)} g por unidade`,
                        ]
                      : []),
              ],
        description:
            product.description ??
            "Consulte disponibilidade e formas de retirada diretamente com o produtor.",
    };
}
