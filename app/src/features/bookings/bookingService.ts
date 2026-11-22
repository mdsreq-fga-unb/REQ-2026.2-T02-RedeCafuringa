import { getApiClient, type ApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { adaptBookingResponse } from "./bookingAdapter";
import { createMockBooking } from "./mockBookingService";
import {
    BOOKING_STATUSES,
    PAYMENT_METHODS,
    type Booking,
    type BookingPayload,
    type BookingResponse,
} from "./bookingTypes";

const ACCESS_TOKEN_KEY = "cafuringa-token";

/** Sem sessão: mesma falha que a API daria (401), sem chamar o servidor. */
export class BookingSessionError extends Error {
    readonly status = 401;

    constructor() {
        super("Sessão ausente.");
        this.name = "BookingSessionError";
    }
}

export function isBookingResponse(data: unknown): data is BookingResponse {
    if (typeof data !== "object" || data === null) return false;
    const item = data as Partial<BookingResponse>;
    return (
        typeof item.id === "string" &&
        item.id !== "" &&
        typeof item.experienciaId === "string" &&
        typeof item.data === "string" &&
        typeof item.horario === "string" &&
        Number.isFinite(item.participantes) &&
        PAYMENT_METHODS.some((method) => method === item.formaPagamento) &&
        BOOKING_STATUSES.some((status) => status === item.status) &&
        typeof item.criadoEm === "string"
    );
}

/** HU44: registra a solicitação de pré-reserva do consumidor autenticado. */
export async function createBooking(
    payload: BookingPayload,
    signal?: AbortSignal,
    client: ApiClient = getApiClient(),
): Promise<Booking> {
    if (isMockAuthEnabled) return createMockBooking(payload);

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) throw new BookingSessionError();

    const data = await client.post<unknown>("/bookings", payload, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
    });
    if (!isBookingResponse(data)) {
        throw new Error("Resposta de pré-reserva inválida.");
    }
    return adaptBookingResponse(data);
}
