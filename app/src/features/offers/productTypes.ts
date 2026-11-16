import type { components } from "@/shared/api/schema";

export type ApiProduct = components["schemas"]["ProductResponse"];

export type ApiProductList = components["schemas"]["ProductListResponse"];

export type Product = {
    grams?: number;
    photos?: string[];
    producerId?: string;
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

export type ApiProductDetails = ApiProduct & {
    descricao?: string;
    medida?: string;
    whatsapp?: string;
};

export type ProductDetails = Product & {
    available: boolean;
    description?: string;
    measure?: string;
    whatsapp?: string;
};