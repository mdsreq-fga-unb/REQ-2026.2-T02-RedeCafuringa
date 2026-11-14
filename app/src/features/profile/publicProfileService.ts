import { apiResourceUrl, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { readMockUserDetails } from "@/features/auth/mockAuth";
import { getPublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { Offer } from "@/shared/types";
import type { components } from "@/shared/api/schema";
import { formatProductPrice } from "@/features/offers/productPrice";
import { demoPublicProfiles, demoPublicOffers } from "./publicProfileDemo";

export type ProducerOffer = Offer & { producerId: string };
type ProductResponse = components["schemas"]["ProductResponse"];
type ProductListResponse = components["schemas"]["ProductListResponse"];

export async function listPublicProducers(
    signal?: AbortSignal,
): Promise<PublicTrajectory[]> {
    if (isMockAuthEnabled) {
        const registered = await Promise.allSettled(
            readMockUserDetails()
                .filter((user) => user.perfil === "PRODUTOR")
                .map((user) => getPublicTrajectory(user.id, signal)),
        );
        return [
            ...demoPublicProfiles,
            ...registered.flatMap((result) =>
                result.status === "fulfilled" ? [result.value] : [],
            ),
        ];
    }
    const data = await getApiClient().get<PublicTrajectory[]>("/producers", {
        auth: false,
        signal,
    });
    if (!Array.isArray(data))
        throw new Error("Resposta de produtores inválida");
    return data.filter((profile) => profile && typeof profile.id === "string");
}

export async function listProducerOffers(
    id: string,
    signal?: AbortSignal,
): Promise<ProducerOffer[]> {
    if (isMockAuthEnabled)
        return demoPublicOffers.filter((offer) => offer.producerId === id);

    const data = await getApiClient().get<ProductListResponse>("/products", {
        query: { produtor: id },
        auth: false,
        signal,
    });
    if (!data || !Array.isArray(data.itens))
        throw new Error("Resposta de ofertas inválida");
    return data.itens
        .filter((product) => product.disponivel && product.produtor?.id === id)
        .map((product) => toProducerOffer(product));
}

function toProducerOffer(product: ProductResponse): ProducerOffer {
    return {
        id: product.id,
        producerId: product.produtor.id,
        title: product.nome,
        category: product.categoria,
        image: product.fotos[0] ? apiResourceUrl(product.fotos[0]) : "",
        price: formatProductPrice(
            product.precoPorUnidade,
            `${product.gramasPorUnidade} g`,
        ),
        details: [
            `${product.gramasPorUnidade} g por unidade`,
            `Produtor: ${product.produtor.nomeIniciativa}`,
        ],
        description: product.descricao,
    };
}
