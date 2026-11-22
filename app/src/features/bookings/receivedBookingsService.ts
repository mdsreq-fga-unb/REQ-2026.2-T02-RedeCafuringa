import {
    apiResourceUrl,
    ApiConfigError,
    ApiHttpError,
    getApiClient,
} from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { BookingSessionError } from "./bookingService";
import {
    BOOKING_STATUSES,
    PAYMENT_METHODS,
    type BookingResponse,
} from "./bookingTypes";
import { demoReceivedBookings } from "./receivedBookingsDemo";

export type ReceivedBooking = BookingResponse & {
    codigo: string;
    experienciaNome: string;
    consumidorNome: string;
    valorTotal: number;
    propriedade?: string;
    mensagemResposta?: string;
};

export type BookingDecision = "aceita" | "recusada";

// Contrato do frontend, a alinhar com a API da HU47.
const receivedPath = "/bookings/received";

function parseBooking(value: unknown): ReceivedBooking {
    if (typeof value === "object" && value !== null) {
        const item = value as Partial<ReceivedBooking>;
        if (
            typeof item.id === "string" &&
            item.id &&
            typeof item.experienciaId === "string" &&
            typeof item.codigo === "string" &&
            typeof item.consumidorNome === "string" &&
            typeof item.experienciaNome === "string" &&
            typeof item.data === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.data) &&
            typeof item.horario === "string" &&
            /^\d{2}:\d{2}$/.test(item.horario) &&
            typeof item.criadoEm === "string" &&
            Number.isInteger(item.participantes) &&
            Number.isFinite(item.valorTotal) &&
            PAYMENT_METHODS.some((method) => method === item.formaPagamento) &&
            BOOKING_STATUSES.some((status) => status === item.status) &&
            [item.mensagem, item.mensagemResposta, item.propriedade].every(
                (field) => field === undefined || typeof field === "string",
            )
        ) {
            return item as ReceivedBooking;
        }
    }
    throw new Error("Resposta de pré-reserva inválida.");
}

function requestOptions(signal: AbortSignal) {
    const token = localStorage.getItem("cafuringa-token");
    if (!token) throw new BookingSessionError();
    const url = new URL(apiResourceUrl(receivedPath), window.location.origin);
    const localDev =
        import.meta.env.DEV &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !localDev) {
        throw new ApiConfigError("A consulta de pré-reservas exige HTTPS.");
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-store",
        },
        signal,
    };
}

export async function listReceivedBookings(
    signal: AbortSignal,
): Promise<ReceivedBooking[]> {
    if (isMockAuthEnabled) return demoReceivedBookings.list();
    const data = await getApiClient().get<unknown>(
        receivedPath,
        requestOptions(signal),
    );
    if (!Array.isArray(data))
        throw new Error("Lista de pré-reservas inválida.");
    return data.map(parseBooking);
}

export async function getReceivedBooking(
    id: string,
    signal: AbortSignal,
): Promise<ReceivedBooking> {
    if (isMockAuthEnabled) return demoReceivedBookings.get(id);
    const booking = parseBooking(
        await getApiClient().get<unknown>(
            `${receivedPath}/${encodeURIComponent(id)}`,
            requestOptions(signal),
        ),
    );
    if (booking.id !== id)
        throw new Error("Pré-reserva diferente da solicitada.");
    return booking;
}

export async function respondToBooking(
    id: string,
    status: BookingDecision,
    message: string,
    signal: AbortSignal,
): Promise<ReceivedBooking> {
    const mensagemResposta = message.trim();
    if (isMockAuthEnabled)
        return demoReceivedBookings.respond(id, status, mensagemResposta);
    const booking = parseBooking(
        await getApiClient().patch<unknown>(
            `${receivedPath}/${encodeURIComponent(id)}/response`,
            { status, ...(mensagemResposta ? { mensagemResposta } : {}) },
            requestOptions(signal),
        ),
    );
    if (booking.id !== id || booking.status !== status) {
        throw new Error("A API não confirmou a resposta solicitada.");
    }
    return booking;
}

export function receivedBookingError(error: unknown) {
    return error instanceof ApiHttpError || error instanceof BookingSessionError
        ? error.status
        : undefined;
}

export function receivedBookingErrorMessage(error: unknown) {
    return error instanceof ApiHttpError ? error.message : undefined;
}
