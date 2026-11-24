import type { components } from "@/shared/api/schema";

/** `videoId` ainda não está no contrato gerado; vem da API de vídeo. */
export type ApiProduct = components["schemas"]["ProductResponse"] & {
    videoId?: string | null;
};

export type ApiProductList = components["schemas"]["ProductListResponse"];

export type Product = {
    grams?: number;
    photos?: string[];
    producerId?: string;
    producerFirstName?: string;
    /** Localidade ou propriedade divulgada pelo responsável (HU20 CA03, HU21 CA08). */
    producerLocation?: string;
    description?: string;
    category?: string;
    local?: string;
    duracao?: string;
    /** Id do vídeo do YouTube divulgado pela produtora. */
    videoId?: string;
    id: string;
    name: string;
    producerName: string;
    price: number;
    unit: string;
    image: string;
};
