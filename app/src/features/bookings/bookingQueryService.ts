import { ApiHttpError, getApiClient, type ApiClient } from "@/shared/api";
import {
    adaptBookingDetail,
    type ApiBookingDetail,
    type BookingDetail,
} from "./bookingDetails";
import { BookingSessionError } from "./bookingService";
import { BOOKING_STATUSES, PAYMENT_METHODS } from "./bookingTypes";

const ACCESS_TOKEN_KEY = "cafuringa-token";
/** Máximo por página aceito pela API (RNF06: respostas enxutas). */
const PAGE_LIMIT = 50;

export type BookingPage = { items: BookingDetail[]; total: number };

type QueryOptions = { client?: ApiClient; signal?: AbortSignal };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isBookingDetail(data: unknown): data is ApiBookingDetail {
    if (!isRecord(data)) return false;
    const { experiencia, contraparte } = data;
    return (
        typeof data.id === "string" &&
        data.id !== "" &&
        typeof data.experienciaId === "string" &&
        typeof data.data === "string" &&
        typeof data.horario === "string" &&
        Number.isFinite(data.participantes) &&
        PAYMENT_METHODS.some((method) => method === data.formaPagamento) &&
        BOOKING_STATUSES.some((status) => status === data.status) &&
        typeof data.criadoEm === "string" &&
        typeof data.atualizadoEm === "string" &&
        isRecord(experiencia) &&
        typeof experiencia.nome === "string" &&
        typeof experiencia.local === "string" &&
        Number.isFinite(experiencia.valorPorPessoa) &&
        isRecord(contraparte) &&
        typeof contraparte.id === "string" &&
        typeof contraparte.nome === "string"
    );
}

function authorization(): Record<string, string> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) throw new BookingSessionError();
    return { Authorization: `Bearer ${token}` };
}

/** 401 vira sessão ausente, para a tela levar ao login. */
function sessionAware(error: unknown): never {
    if (error instanceof ApiHttpError && error.status === 401)
        throw new BookingSessionError();
    throw error;
}

async function listBookings(
    scope: "mine" | "received",
    { client = getApiClient(), signal }: QueryOptions,
): Promise<BookingPage> {
    const headers = authorization();
    const data = await client
        .get<unknown>(`/bookings/${scope}?limite=${PAGE_LIMIT}`, {
            headers,
            signal,
        })
        .catch(sessionAware);
    if (
        !isRecord(data) ||
        !Array.isArray(data.itens) ||
        !Number.isFinite(data.total) ||
        !data.itens.every(isBookingDetail)
    )
        throw new Error("Resposta de pré-reservas inválida.");
    return {
        items: (data.itens as ApiBookingDetail[]).map((item) =>
            adaptBookingDetail(item),
        ),
        total: data.total as number,
    };
}

/** HU45 CA02: solicitações feitas pela consumidora autenticada. */
export function listMyBookings(
    options: QueryOptions = {},
): Promise<BookingPage> {
    return listBookings("mine", options);
}

/** HU45 CA03: solicitações recebidas para as experiências da produtora. */
export function listReceivedBookings(
    options: QueryOptions = {},
): Promise<BookingPage> {
    return listBookings("received", options);
}

/**
 * HU45 CA04, CA07: uma solicitação, com a situação gravada agora. Devolve
 * `null` quando a API responde 404: inexistente ou de outra conta (CA05).
 */
export async function getBooking(
    id: string,
    { client = getApiClient(), signal }: QueryOptions = {},
): Promise<BookingDetail | null> {
    const headers = authorization();
    let data: unknown;
    try {
        data = await client.get<unknown>(
            `/bookings/${encodeURIComponent(id)}`,
            { headers, signal },
        );
    } catch (error) {
        if (error instanceof ApiHttpError && error.status === 404) return null;
        sessionAware(error);
    }
    if (!isBookingDetail(data))
        throw new Error("Resposta de pré-reserva inválida.");
    return adaptBookingDetail(data);
}
