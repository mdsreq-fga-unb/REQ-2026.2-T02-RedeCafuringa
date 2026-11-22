import { apiResourceUrl, ApiHttpError, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { demoPublicProfiles } from "@/features/profile/publicProfileDemo";
import {
    BOOKING_STATUSES,
    PAYMENT_METHODS,
    type BookingResponse,
} from "./bookingTypes";

export type BookingUpdate = Pick<
    BookingResponse,
    "data" | "horario" | "participantes"
> & {
    id: string;
    reservaId: string;
    codigo: string;
    experienciaNome: string;
    status: Exclude<BookingResponse["status"], "pendente">;
    nova: boolean;
};

export type ConsultedBooking = BookingResponse & {
    codigo: string;
    experienciaNome: string;
    propriedade?: string;
    valorTotal: number;
    mensagemResposta?: string;
    telefonePublico?: string;
};

const sample: ConsultedBooking = {
    id: "demo-reserva-124",
    codigo: "CAF-0124",
    experienciaId: "queijos",
    experienciaNome: "Visita e Degustação de Queijos",
    propriedade: "Cafuringa, DF",
    data: "2026-10-17",
    horario: "09:00",
    participantes: 2,
    valorTotal: 90,
    formaPagamento: "pix",
    status: "aceita",
    criadoEm: "2026-10-01T12:00:00Z",
    mensagem: "Gostaríamos de conhecer o sítio.",
    mensagemResposta: "Podemos receber vocês às 9h. Até lá!",
    telefonePublico:
        demoPublicProfiles.find((profile) => profile.id === "demo-jefferson")
            ?.telefone ?? undefined,
};

const demoBookings: { owner: string; booking: ConsultedBooking }[] = [
    { owner: "1", booking: sample },
    {
        owner: "1",
        booking: {
            ...sample,
            id: "demo-reserva-125",
            codigo: "CAF-0125",
            status: "recusada",
            mensagemResposta: "Infelizmente não teremos disponibilidade.",
        },
    },
    {
        owner: "1",
        booking: {
            ...sample,
            id: "demo-reserva-126",
            codigo: "CAF-0126",
            status: "pendente",
            mensagemResposta: undefined,
        },
    },
    {
        owner: "2",
        booking: {
            ...sample,
            id: "demo-reserva-127",
            codigo: "CAF-0127",
            status: "cancelada",
            mensagemResposta: undefined,
        },
    },
];

function sessionToken() {
    const role = localStorage.getItem("cafuringa-role");
    const token = localStorage.getItem("cafuringa-token");
    if (!token || (role !== "consumer" && role !== "producer")) {
        throw new ApiHttpError({
            status: 401,
            message: "Sessão indisponível.",
        });
    }
    return token;
}

function demoForToken(token: string) {
    const userId = localStorage.getItem("cafuringa-user-id");
    return demoBookings.filter(
        ({ owner }) => owner === userId && token === `mock-token-${owner}`,
    );
}

function requestOptions(path: string, signal: AbortSignal, token: string) {
    const url = new URL(apiResourceUrl(path), window.location.origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(import.meta.env.DEV && local)) {
        throw new Error("A consulta de pré-reserva exige HTTPS.");
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-store",
        },
        signal,
    };
}

// Contrato provisório enquanto os endpoints de consulta da HU48 são definidos.
export async function listBookingUpdates(
    signal: AbortSignal,
): Promise<BookingUpdate[]> {
    const token = sessionToken();
    if (isMockAuthEnabled) {
        return demoForToken(token).flatMap(({ booking }, index) =>
            booking.status === "pendente"
                ? []
                : [
                      {
                          id: `atualizacao-${booking.id}`,
                          reservaId: booking.id,
                          codigo: booking.codigo,
                          experienciaNome: booking.experienciaNome,
                          data: booking.data,
                          horario: booking.horario,
                          participantes: booking.participantes,
                          status: booking.status,
                          nova: index === 0,
                      },
                  ],
        );
    }
    const path = "/bookings/notifications";
    const data = await getApiClient().get<unknown>(
        path,
        requestOptions(path, signal, token),
    );
    if (!Array.isArray(data))
        throw new Error("Lista de notificações inválida.");
    return data.flatMap((value: unknown) => {
        if (typeof value !== "object" || value === null) return [];
        const item = value as Partial<BookingUpdate>;
        if (
            typeof item.id !== "string" ||
            !item.id ||
            typeof item.reservaId !== "string" ||
            !item.reservaId ||
            typeof item.codigo !== "string" ||
            typeof item.experienciaNome !== "string" ||
            typeof item.data !== "string" ||
            typeof item.horario !== "string" ||
            typeof item.participantes !== "number" ||
            !Number.isInteger(item.participantes) ||
            typeof item.nova !== "boolean" ||
            !BOOKING_STATUSES.some(
                (status) => status !== "pendente" && status === item.status,
            ) ||
            !item.status
        )
            return [];
        const {
            id,
            reservaId,
            codigo,
            experienciaNome,
            data,
            horario,
            participantes,
            status,
            nova,
        } = item;
        return [
            {
                id,
                reservaId,
                codigo,
                experienciaNome,
                data,
                horario,
                participantes,
                status,
                nova,
            },
        ];
    });
}

export async function getConsultedBooking(
    id: string,
    signal: AbortSignal,
): Promise<ConsultedBooking> {
    const token = sessionToken();
    if (isMockAuthEnabled) {
        const result = demoForToken(token).find(
            ({ booking }) => booking.id === id,
        );
        if (result) return result.booking;
        throw new ApiHttpError({
            status: 404,
            message: "Pré-reserva indisponível.",
        });
    }
    if (!id || id === "." || id === "..")
        throw new ApiHttpError({
            status: 404,
            message: "Pré-reserva indisponível.",
        });
    const path = `/bookings/${encodeURIComponent(id)}`;
    const data = await getApiClient().get<Partial<ConsultedBooking> | null>(
        path,
        requestOptions(path, signal, token),
    );
    if (
        !data ||
        data.id !== id ||
        typeof data.codigo !== "string" ||
        typeof data.experienciaId !== "string" ||
        typeof data.experienciaNome !== "string" ||
        typeof data.data !== "string" ||
        typeof data.horario !== "string" ||
        typeof data.criadoEm !== "string" ||
        !Number.isInteger(data.participantes) ||
        !Number.isFinite(data.valorTotal) ||
        !BOOKING_STATUSES.some((status) => status === data.status) ||
        !PAYMENT_METHODS.some((method) => method === data.formaPagamento) ||
        ![
            data.propriedade,
            data.mensagem,
            data.mensagemResposta,
            data.telefonePublico,
        ].every((field) => field == null || typeof field === "string")
    )
        throw new Error("Pré-reserva inválida.");
    return data as ConsultedBooking;
}
