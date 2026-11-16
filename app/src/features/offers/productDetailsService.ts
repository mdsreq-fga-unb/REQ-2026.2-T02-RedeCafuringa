import {
    ApiHttpError,
    apiResourceUrl,
    getApiClient,
    type ApiClient,
} from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { mockApiProducts } from "./mockProducts";
import { readDemoOffers } from "./publishedOffers";
import { toProductList } from "./productAdapter";
import type { ApiProduct, Product } from "./productTypes";

/** HU20: consulta individual pública, sem reutilizar um resumo desatualizado. */
export async function getProductDetails(
    id: string,
    signal?: AbortSignal,
    client: ApiClient = getApiClient(),
): Promise<Product | null> {
    let data: ApiProduct;
    if (isMockAuthEnabled) {
        const saved = readDemoOffers().find(
            (item) => item.id === id && "precoPorUnidade" in item,
        );
        const example = mockApiProducts.find((item) => item.id === id);
        if (saved && "precoPorUnidade" in saved) {
            data = {
                ...saved,
                categoria: "Produtos",
                disponivel: saved.disponivel ?? true,
                criadoEm: "",
            };
        } else if (example) data = example;
        else return null;
    } else {
        try {
            data = await client.get<ApiProduct>(
                `/products/${encodeURIComponent(id)}`,
                { auth: false, signal },
            );
        } catch (error) {
            if (
                error instanceof ApiHttpError &&
                [404, 410].includes(error.status)
            )
                return null;
            throw error;
        }
    }
    if (data.id !== id || data.disponivel === false) return null;
    if (
        data.disponivel !== true ||
        !data.produtor?.id ||
        !data.produtor.nomeIniciativa ||
        typeof data.descricao !== "string" ||
        !Number.isFinite(data.precoPorUnidade) ||
        !Array.isArray(data.fotos)
    )
        throw new Error("Resposta de produto inválida.");
    const photo = isMockAuthEnabled ? (path: string) => path : apiResourceUrl;
    // Só os campos públicos necessários entram no modelo visual.
    const [product] = toProductList([data], photo);
    return {
        ...product,
        grams: data.gramasPorUnidade,
        photos: data.fotos.map(photo),
    };
}
