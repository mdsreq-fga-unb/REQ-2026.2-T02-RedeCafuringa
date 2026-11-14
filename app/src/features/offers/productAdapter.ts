import { apiResourceUrl } from "@/shared/api";
import type { ApiProduct, Product } from "./productTypes";

export function toProductList(
    items: ApiProduct[],
    resolvePhoto: (path: string) => string = apiResourceUrl,
): Product[] {
    return items
        .filter((item) => item.disponivel)
        .map((item) => ({
            id: item.id,
            name: item.nome,
            producerName: item.produtor.nomeIniciativa,
            price: item.precoPorUnidade,
            unit: "unidade",
            image: resolvePhoto(item.fotos[0]),
        }));
}
