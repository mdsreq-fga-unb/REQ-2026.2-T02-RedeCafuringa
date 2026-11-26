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
            producerId: item.produtor.id,
            description: item.descricao,
            category: item.categoria,
            name: item.nome,
            producerName: item.produtor.nomeIniciativa,
            ...(item.produtor.primeiroNome
                ? { producerFirstName: item.produtor.primeiroNome }
                : {}),
            ...(item.produtor.localidade
                ? { producerLocation: item.produtor.localidade }
                : {}),
            ...(item.videoId ? { videoId: item.videoId } : {}),
            price: item.precoPorUnidade,
            unit: "unidade",
            image: item.fotos[0] ? resolvePhoto(item.fotos[0]) : "",
        }));
}
