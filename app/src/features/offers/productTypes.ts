import type { components } from "@/shared/api/schema";
import type { PaymentMethod } from "@/features/bookings/bookingTypes";

export type ApiProduct = components["schemas"]["ProductResponse"];

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
    /** Experiência: se o aceite pede sinal de 50% por Pix. */
    requiresDeposit?: boolean;
    /** Experiência: formas que a produtora aceita no dia. */
    dayPaymentMethods?: PaymentMethod[];
    /** Id do vídeo do YouTube divulgado pela produtora. */
    videoId?: string;
    id: string;
    name: string;
    producerName: string;
    price: number;
    unit: string;
    image: string;
};
