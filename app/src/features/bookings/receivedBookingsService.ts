import {
    apiResourceUrl,
    ApiConfigError,
    ApiHttpError,
    getApiClient,
} from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import type { ApiBookingList } from "./bookingDetails";
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
    const client = getApiClient();
    const options = requestOptions(signal);
    const bookings: ReceivedBooking[] = [];
    let page = 1;

    while (true) {
        const path =
            page === 1 ? receivedPath : `${receivedPath}?pagina=${page}`;
        const data = await client.get<ApiBookingList>(path, options);
        if (
            !data ||
            !Array.isArray(data.itens) ||
            !Number.isSafeInteger(data.total) ||
            data.total < 0
        ) {
            throw new Error("Lista de pré-reservas inválida.");
        }
        for (const item of data.itens) {
            bookings.push(
                parseBooking({
                    ...item,
                    codigo: `CAF-${item.id.slice(-6).toUpperCase()}`,
                    experienciaNome: item.experiencia.nome,
                    consumidorNome: item.contraparte.nome,
                    valorTotal:
                        item.experiencia.valorPorPessoa * item.participantes,
                }),
            );
        }
        if (data.itens.length === 0 || bookings.length >= data.total) {
            return bookings;
        }
        page += 1;
    }
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
