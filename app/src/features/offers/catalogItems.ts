import { apiResourceUrl, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import type { Product } from "./productTypes";
import { readDemoOffers, type RegisteredOffer } from "./publishedOffers";
import type { RegisteredExperience } from "./experienceService";
import { offers } from "./offerData";

export function registeredToCatalogItem(offer: RegisteredOffer): Product {
    const experience = "valorPorPessoa" in offer;
    const photo = offer.fotos[0];
    return {
        id: offer.id,
        name: offer.nome,
        producerId: offer.produtor.id,
        producerName: offer.produtor.nomeIniciativa,
        description: offer.descricao,
        category: experience ? "Experiências" : "Produtos",
        price: experience ? offer.valorPorPessoa : offer.precoPorUnidade,
        unit: experience ? "pessoa" : "unidade",
        image: photo ? (isMockAuthEnabled ? photo : apiResourceUrl(photo)) : "",
        ...(experience ? { local: offer.local, duracao: offer.duracao } : {}),
    };
}

export async function listExperiences(): Promise<Product[]> {
    if (isMockAuthEnabled) {
        const created = readDemoOffers()
            .filter(
                (item) => "valorPorPessoa" in item && item.disponivel !== false,
            )
            .map(registeredToCatalogItem);
        return [
            ...created,
            ...offers
                .filter((item) => item.category.startsWith("Experi"))
                .map((item) => ({
                    id: item.id,
                    name: item.title,
                    category: "Experiências",
                    description: item.description,
                    producerId: "demo-jefferson",
                    producerName: "Jefferson Sooma",
                    price: 45,
                    unit: "pessoa",
                    image: item.image,
                    local: "Cafuringa, DF",
                    duracao: "2 horas",
                })),
        ];
    }
    type Page = {
        itens: RegisteredExperience[];
        total: number;
        pagina: number;
        limite: number;
    };
    let page = await getApiClient().get<Page>("/experiences?limite=50", {
        auth: false,
    });
    const items = [...page.itens];
    while (page.pagina * page.limite < page.total) {
        const next = await getApiClient().get<Page>(
            `/experiences?limite=50&pagina=${page.pagina + 1}`,
            { auth: false },
        );
        if (!next.itens.length || next.pagina <= page.pagina)
            throw new Error("Falha ao carregar experiências.");
        items.push(...next.itens);
        page = next;
    }
    return items
        .filter((item) => item.disponivel !== false)
        .map(registeredToCatalogItem);
}
