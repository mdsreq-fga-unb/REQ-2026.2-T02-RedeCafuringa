import type { components } from "@/shared/api/schema";

export type ApiProduct = components["schemas"]["ProductResponse"];

export type ApiProductList = components["schemas"]["ProductListResponse"];

export type Product = {
    grams?: number;
    photos?: string[];
    producerId?: string;
    /** Localidade ou propriedade divulgada pelo responsável (HU20 CA03, HU21 CA08). */
    producerLocation?: string;
    description?: string;
    category?: string;
    local?: string;
    duracao?: string;
    id: string;
    name: string;
    producerName: string;
    price: number;
    unit: string;
    image: string;
};
