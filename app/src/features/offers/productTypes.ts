import type { components } from "@/shared/api/schema";

export type ApiProduct = components["schemas"]["ProductResponse"];

export type ApiProductList = components["schemas"]["ProductListResponse"];

export type Product = {
    id: string;
    name: string;
    producerName: string;
    price: number;
    unit: string;
    image: string;
};