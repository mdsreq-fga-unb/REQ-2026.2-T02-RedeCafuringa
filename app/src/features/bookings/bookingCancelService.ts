import { isMockAuthEnabled } from "@/features/auth/authMode";
import { ApiHttpError, getApiClient, type ApiClient } from "@/shared/api";
import { adaptBookingResponse } from "./bookingAdapter";
import { BookingSessionError, isBookingResponse } from "./bookingService";
import type { Booking } from "./bookingTypes";
import { cancelMockBooking } from "./mockBookingService";

const ACCESS_TOKEN_KEY = "cafuringa-token";

export type BookingCancelReason = "nao-encontrada" | "nao-cancelavel";

/**
 * O cancelamento não aconteceu e a solicitação continua como estava: não é
 * de quem pediu ou não existe (404, CA05), ou não está mais pendente (409, RN20).
 */
export class BookingCancelError extends Error {
    readonly reason: BookingCancelReason;

    constructor(reason: BookingCancelReason, message: string) {
        super(message);
        this.name = "BookingCancelError";
        this.reason = reason;
    }
}

type CancelOptions = { client?: ApiClient; signal?: AbortSignal };

/** HU46: a consumidora cancela a própria solicitação pendente (RN20). */
export async function cancelBooking(
    id: string,
    { client = getApiClient(), signal }: CancelOptions = {},
): Promise<Booking> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) throw new BookingSessionError();
    if (isMockAuthEnabled) return cancelInDemo(id);

    let data: unknown;
    try {
        data = await client.patch<unknown>(
            `/bookings/${encodeURIComponent(id)}/cancel`,
            undefined,
            { headers: { Authorization: `Bearer ${token}` }, signal },
        );
    } catch (error) {
        if (error instanceof ApiHttpError) {
            if (error.status === 401) throw new BookingSessionError();
            if (error.status === 404)
                throw new BookingCancelError(
                    "nao-encontrada",
                    "Pré-reserva não encontrada.",
                );
            if (error.status === 409)
                throw new BookingCancelError(
                    "nao-cancelavel",
                    error.details[0] ?? error.message,
                );
        }
        throw error;
    }
    if (!isBookingResponse(data) || data.status !== "cancelada")
        throw new Error("Resposta de cancelamento inválida.");
    return adaptBookingResponse(data);
}

/** Demonstração: mesmas regras, sobre as pré-reservas guardadas no navegador. */
function cancelInDemo(id: string): Booking {
    const userId = localStorage.getItem("cafuringa-user-id");
    if (!userId) throw new BookingSessionError();
    const result = cancelMockBooking(id, userId);
    if (result.ok) return adaptBookingResponse(result.booking);
    throw result.reason === "nao-encontrada"
        ? new BookingCancelError(
              "nao-encontrada",
              "Pré-reserva não encontrada.",
          )
        : new BookingCancelError("nao-cancelavel", result.message);
}
