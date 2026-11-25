import { isMockAuthEnabled } from "@/features/auth/authMode";
import { ApiHttpError, getApiClient, type ApiClient } from "@/shared/api";
import {
    adaptPayment,
    type ApiPayment,
    type BookingPayment,
} from "./bookingDetails";
import { BookingSessionError } from "./bookingService";
import {
    updateMockPayment,
    type MockPaymentAction,
} from "./mockBookingQueries";

/** A ação no sinal não foi registrada; a mensagem diz o motivo, pronta para exibir. */
export class BookingPaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BookingPaymentError";
    }
}

type Options = { client?: ApiClient; signal?: AbortSignal };

const PATHS: Record<MockPaymentAction, (id: string) => string> = {
    "enviar-comprovante": (id) => `/bookings/${id}/payment/sent`,
    "confirmar-sinal": (id) => `/bookings/received/${id}/payment/confirm`,
    "nao-encontrado": (id) => `/bookings/received/${id}/payment/not-found`,
};

async function act(
    action: MockPaymentAction,
    id: string,
    { client = getApiClient(), signal }: Options,
): Promise<BookingPayment> {
    const token = localStorage.getItem("cafuringa-token");
    if (!token) throw new BookingSessionError();
    if (isMockAuthEnabled) {
        const result = await updateMockPayment(id, action, {
            role: localStorage.getItem("cafuringa-role"),
            userId: localStorage.getItem("cafuringa-user-id") ?? "",
        });
        if (!result.ok) throw new BookingPaymentError(result.message);
        return adaptPayment(result.payment);
    }
    try {
        const data = await client.patch<ApiPayment>(
            PATHS[action](encodeURIComponent(id)),
            undefined,
            { headers: { Authorization: `Bearer ${token}` }, signal },
        );
        return adaptPayment(data);
    } catch (error) {
        if (error instanceof ApiHttpError) {
            if (error.status === 401) throw new BookingSessionError();
            if (error.status === 404)
                throw new BookingPaymentError("Pré-reserva não encontrada.");
            if (error.status === 409 || error.status === 403)
                throw new BookingPaymentError(
                    error.details[0] ?? error.message,
                );
        }
        throw error;
    }
}

/** A consumidora avisa que pagou o sinal (o comprovante vai pelo WhatsApp). */
export const reportDepositSent = (id: string, options: Options = {}) =>
    act("enviar-comprovante", id, options);

/** A produtora confirma que o sinal caiu no extrato. */
export const confirmDeposit = (id: string, options: Options = {}) =>
    act("confirmar-sinal", id, options);

/** A produtora não encontrou o Pix no extrato: volta a aguardar o sinal. */
export const reportDepositNotFound = (id: string, options: Options = {}) =>
    act("nao-encontrado", id, options);
