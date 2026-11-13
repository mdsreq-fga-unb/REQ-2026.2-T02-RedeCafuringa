import type { ApiProductDetails, ProductDetails } from "./productTypes";

function optionalText(value?: string): string | undefined {
    const text = value?.trim();
    return text ? text : undefined;
}

export function toProductDetails(item: ApiProductDetails): ProductDetails {
    return {
        id: item.id,
        name: item.nome,
        producerName: item.produtor,
        price: item.preco,
        unit: item.unidade,
        image: item.imagemUrl,
        available: item.disponivel,
        description: optionalText(item.descricao),
        measure: optionalText(item.medida),
        whatsapp: optionalText(item.whatsapp),
    };
}