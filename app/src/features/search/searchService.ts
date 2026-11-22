import { isMockAuthEnabled } from "@/features/auth/authMode";
import {
    listExperiences,
    registeredToCatalogItem,
} from "@/features/offers/catalogItems";
import { toProductList } from "@/features/offers/productAdapter";
import {
    filterProducts,
    normalizeSearchText,
} from "@/features/offers/productSearch";
import { listProducts } from "@/features/offers/productService";
import type { Product } from "@/features/offers/productTypes";
import type { RegisteredExperience } from "@/features/offers/experienceService";
import { listPublicProducers } from "@/features/profile/publicProfileService";
import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import { getApiClient, type ApiClient } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import { normalizeSearchTerm } from "./searchTerm";

type ApiSearchResponse = components["schemas"]["SearchResponse"];

export type SearchGroup<T> = { itens: T[]; total: number };

/** Resultado da busca de ofertas (HU36), agrupado por tipo e pronto para a tela. */
export type SearchResults = {
    termo: string;
    produtores: SearchGroup<PublicTrajectory>;
    produtos: SearchGroup<Product>;
    experiencias: SearchGroup<Product>;
};

type SearchOptions = { client?: ApiClient; signal?: AbortSignal };

function matchesProducer(producer: PublicTrajectory, term: string): boolean {
    const text = [
        producer.nomeIniciativa,
        producer.trajetoria,
        producer.atividades,
    ]
        .map((part) => normalizeSearchText(part ?? ""))
        .join(" ");
    return text.includes(normalizeSearchText(term));
}

/** Demonstração: mesma busca, feita sobre os dados fictícios do navegador. */
async function searchDemo(term: string): Promise<SearchResults> {
    const [producers, products, experiences] = await Promise.all([
        listPublicProducers(),
        listProducts(),
        listExperiences(),
    ]);
    const foundProducers = producers.filter((producer) =>
        matchesProducer(producer, term),
    );
    const foundProducts = filterProducts(products, term);
    const foundExperiences = filterProducts(experiences, term);
    return {
        termo: term,
        produtores: { itens: foundProducers, total: foundProducers.length },
        produtos: { itens: foundProducts, total: foundProducts.length },
        experiencias: {
            itens: foundExperiences,
            total: foundExperiences.length,
        },
    };
}

/**
 * HU36/RF36: busca pública (sem login, CA09) por produtores, produtos e
 * experiências. Erros da API sobem para a tela tratar; no 400, `details`
 * traz a orientação de correção do termo (CA08).
 */
export async function searchOffers(
    rawTerm: string,
    { client = getApiClient(), signal }: SearchOptions = {},
): Promise<SearchResults> {
    const term = normalizeSearchTerm(rawTerm);
    if (isMockAuthEnabled) return searchDemo(term);

    const data = await client.get<ApiSearchResponse>(
        `/search?busca=${encodeURIComponent(term)}`,
        { auth: false, signal },
    );
    return {
        termo: data.termo,
        produtores: data.produtores,
        produtos: {
            itens: toProductList(data.produtos.itens),
            total: data.produtos.total,
        },
        experiencias: {
            itens: data.experiencias.itens
                .filter((item) => item.disponivel !== false)
                .map((item) =>
                    registeredToCatalogItem(item as RegisteredExperience),
                ),
            total: data.experiencias.total,
        },
    };
}
