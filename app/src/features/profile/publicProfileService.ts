import { readDemoOffers } from "@/features/offers/publishedOffers";
import { registeredToCatalogItem } from "@/features/offers/catalogItems";
import { productToOffer } from "@/features/offers/productOffer";
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
type ExperienceListResponse = components["schemas"]["ExperienceListResponse"];

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
        return [
            ...readDemoOffers()
                .filter((item) => item.disponivel !== false)
                .map((item) => ({
                    ...productToOffer(registeredToCatalogItem(item)),
                    producerId: item.produtor.id,
                })),
            ...demoPublicOffers,
        ].filter((offer) => offer.producerId === id);

    // Produtos (HU15) e experiências (HU21) do mesmo responsável, em paralelo.
    const [data, experiences] = await Promise.all([
        getApiClient().get<ProductListResponse>("/products", {
            query: { produtor: id },
            auth: false,
            signal,
        }),
        getApiClient().get<ExperienceListResponse>("/experiences", {
            query: { produtor: id },
            auth: false,
            signal,
        }),
    ]);
    if (
        !data ||
        !Array.isArray(data.itens) ||
        !experiences ||
        !Array.isArray(experiences.itens)
    )
        throw new Error("Resposta de ofertas inválida");
    return [
        ...data.itens
            .filter(
                (product) => product.disponivel && product.produtor?.id === id,
            )
            .map((product) => toProducerOffer(product)),
        // Nunca mistura ofertas de outros produtores, mesmo se a API devolver uma lista ampla.
        ...experiences.itens
            .filter((item) => item.disponivel && item.produtor?.id === id)
            .map((item) => ({
                ...productToOffer(registeredToCatalogItem(item)),
                producerId: id,
            })),
    ];
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
            `Produtora: ${product.produtor.primeiroNome || product.produtor.nomeIniciativa}`,
        ],
        description: product.descricao,
    };
}
