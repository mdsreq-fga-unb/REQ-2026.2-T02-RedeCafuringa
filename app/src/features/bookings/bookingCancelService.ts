import { isMockAuthEnabled } from "@/features/auth/authMode";
import { ApiHttpError, getApiClient, type ApiClient } from "@/shared/api";
import { adaptBookingResponse } from "./bookingAdapter";
import { BookingSessionError, isBookingResponse } from "./bookingService";
import type { DepositOnCancel } from "./bookingCancellation";
import type { Booking } from "./bookingTypes";
import { cancelMockBooking } from "./mockBookingService";
import { cancelMockAccepted } from "./mockBookingQueries";

/** A solicitação cancelada e, se havia sinal pago, o destino dele. */
export type CancelledBooking = Booking & { deposit?: DepositOnCancel };

type ApiDeposit = { resultado: "devolver" | "retido"; valor: number };

function withDeposit(data: unknown): CancelledBooking {
    if (!isBookingResponse(data) || data.status !== "cancelada")
        throw new Error("Resposta de cancelamento inválida.");
    const sinal = (data as { sinal?: ApiDeposit }).sinal;
    return {
        ...adaptBookingResponse(data),
        ...(sinal
            ? {
                  deposit: {
                      result: sinal.resultado,
                      cents: Math.round(sinal.valor * 100),
                  },
              }
            : {}),
    };
}

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

/** HU46: a consumidora cancela a própria solicitação pendente ou aceita (RN20 revista). */
export async function cancelBooking(
    id: string,
    options: CancelOptions = {},
): Promise<CancelledBooking> {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY))
        throw new BookingSessionError();
    if (isMockAuthEnabled) return cancelInDemo(id);
    return send(`/bookings/${encodeURIComponent(id)}/cancel`, options);
}

/** A produtora cancela a pré-reserva aceita e devolve o sinal pago. */
export async function cancelBookingByProducer(
    id: string,
    options: CancelOptions = {},
): Promise<CancelledBooking> {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY))
        throw new BookingSessionError();
    if (isMockAuthEnabled) return cancelAcceptedInDemo(id, "produtora");
    return send(`/bookings/received/${encodeURIComponent(id)}/cancel`, options);
}

async function send(
    path: string,
    { client = getApiClient(), signal }: CancelOptions,
): Promise<CancelledBooking> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    let data: unknown;
    try {
        data = await client.patch<unknown>(path, undefined, {
            headers: { Authorization: `Bearer ${token}` },
            signal,
        });
    } catch (error) {
        if (error instanceof ApiHttpError) {
            if (error.status === 401) throw new BookingSessionError();
            if (error.status === 404)
                throw new BookingCancelError(
                    "nao-encontrada",
                    "Pré-reserva não encontrada.",
                );
            if (error.status === 409 || error.status === 403)
                throw new BookingCancelError(
                    "nao-cancelavel",
                    error.details[0] ?? error.message,
                );
        }
        throw error;
    }
    return withDeposit(data);
}

/** Demonstração: mesmas regras, sobre as pré-reservas guardadas no navegador. */
async function cancelInDemo(id: string): Promise<CancelledBooking> {
    const userId = localStorage.getItem("cafuringa-user-id");
    if (!userId) throw new BookingSessionError();
    const result = cancelMockBooking(id, userId);
    if (result.ok) return adaptBookingResponse(result.booking);
    if (result.reason === "aceita")
        return cancelAcceptedInDemo(id, "consumidora");
    throw result.reason === "nao-encontrada"
        ? new BookingCancelError(
              "nao-encontrada",
              "Pré-reserva não encontrada.",
          )
        : new BookingCancelError("nao-cancelavel", result.message);
}

async function cancelAcceptedInDemo(
    id: string,
    by: "consumidora" | "produtora",
): Promise<CancelledBooking> {
    const result = await cancelMockAccepted(id, by, {
        role: localStorage.getItem("cafuringa-role"),
        userId: localStorage.getItem("cafuringa-user-id") ?? "",
    });
    if (!result.ok)
        throw result.reason === "nao-encontrada"
            ? new BookingCancelError(
                  "nao-encontrada",
                  "Pré-reserva não encontrada.",
              )
            : new BookingCancelError("nao-cancelavel", result.message);
    return withDeposit(result.booking);
}
