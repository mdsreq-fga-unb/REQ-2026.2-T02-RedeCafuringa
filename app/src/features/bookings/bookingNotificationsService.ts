import { apiResourceUrl, ApiHttpError, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import type { components } from "@/shared/api/schema";
import { listMyBookings, listReceivedBookings } from "./bookingQueryService";
import {
    bookingCode,
    type PaymentStatus,
    type RefundStatus,
} from "./bookingDetails";

type Notification = components["schemas"]["BookingNotificationResponse"];
export type BookingUpdate = Notification & { nova: boolean };

const PAYMENT_STATUSES: readonly PaymentStatus[] = [
    "aguardando-sinal",
    "comprovante-enviado",
    "sinal-confirmado",
    "expirado",
    "dispensado",
    "pagamento-recebido",
];
const REFUND_STATUSES: readonly RefundStatus[] = [
    "pendente",
    "feita",
    "retido",
];

/**
 * Id da atualização, igual ao da API: cada mudança do sinal ou da devolução
 * é uma notificação nova, e abrir o detalhe marca como lida a mudança atual.
 */
export function bookingUpdateId(booking: {
    id: string;
    status: string;
    payment?: { status: PaymentStatus; refund?: RefundStatus };
}): string {
    return [
        booking.id,
        booking.status,
        booking.payment?.status,
        booking.payment?.refund,
    ]
        .filter(Boolean)
        .join(":");
}

const STATUS_LABEL: Record<Notification["status"], string> = {
    aceita: "Aceito",
    recusada: "Recusado",
    cancelada: "Cancelado",
};

const PAYMENT_LABEL: Record<
    PaymentStatus,
    { consumer: string; producer: string }
> = {
    "aguardando-sinal": {
        consumer: "Aceito: pague o sinal",
        producer: "Aceito: aguardando o sinal",
    },
    "comprovante-enviado": {
        consumer: "Comprovante enviado",
        producer: "Confira o pagamento do sinal",
    },
    "sinal-confirmado": {
        consumer: "Sinal confirmado",
        producer: "Sinal confirmado",
    },
    expirado: {
        consumer: "Prazo do sinal vencido",
        producer: "Prazo do sinal vencido",
    },
    dispensado: { consumer: "Aceito sem sinal", producer: "Aceito sem sinal" },
    "pagamento-recebido": {
        consumer: "Pagamento recebido",
        producer: "Pagamento recebido",
    },
};

const REFUND_LABEL: Record<
    RefundStatus,
    { consumer: string; producer: string }
> = {
    pendente: {
        consumer: "Cancelado: devolução do sinal pendente",
        producer: "Cancelado: devolva o sinal",
    },
    feita: { consumer: "Sinal devolvido", producer: "Sinal devolvido" },
    retido: {
        consumer: "Cancelado: sinal retido",
        producer: "Cancelado: sinal retido",
    },
};

/** O que a notificação diz, conforme quem vê: o próximo passo do sinal, se houver. */
export function bookingUpdateLabel(
    update: BookingUpdate,
    role: "consumer" | "producer",
): string {
    if (update.devolucao) return REFUND_LABEL[update.devolucao][role];
    if (update.status === "aceita" && update.pagamento)
        return PAYMENT_LABEL[update.pagamento][role];
    return STATUS_LABEL[update.status];
}

/** Confere cada notificação e marca as ainda não lidas. */
export function toBookingUpdates(list: unknown): BookingUpdate[] {
    if (!Array.isArray(list))
        throw new Error("Lista de notificações inválida.");
    return (list as Notification[]).map(
        ({
            id,
            reservaId,
            codigo,
            experienciaNome,
            data,
            horario,
            participantes,
            status,
            pagamento,
            devolucao,
        }) => {
            if (
                ![id, reservaId, codigo, experienciaNome, data, horario].every(
                    (value) => typeof value === "string" && value,
                ) ||
                !Number.isSafeInteger(participantes) ||
                participantes < 1 ||
                !["aceita", "recusada", "cancelada"].includes(status) ||
                (pagamento !== undefined &&
                    !PAYMENT_STATUSES.includes(pagamento)) ||
                (devolucao !== undefined &&
                    !REFUND_STATUSES.includes(devolucao))
            ) {
                throw new Error("Notificação inválida.");
            }
            return {
                id,
                reservaId,
                codigo,
                experienciaNome,
                data,
                horario,
                participantes,
                status,
                ...(pagamento ? { pagamento } : {}),
                ...(devolucao ? { devolucao } : {}),
                nova: localStorage.getItem(readKey(id)) !== "read",
            };
        },
    );
}

function readKey(id: string) {
    const role = localStorage.getItem("cafuringa-role");
    const userId = localStorage.getItem("cafuringa-user-id");
    return `cafuringa-booking-update:${role}:${userId}:${id}`;
}

export const BOOKING_UPDATE_READ_EVENT = "cafuringa:booking-update-read";

export function markBookingUpdateRead(id: string) {
    localStorage.setItem(readKey(id), "read");
    window.dispatchEvent(
        new CustomEvent(BOOKING_UPDATE_READ_EVENT, { detail: id }),
    );
}

export async function listBookingUpdates(
    signal: AbortSignal,
): Promise<BookingUpdate[]> {
    const token = localStorage.getItem("cafuringa-token");
    if (!token)
        throw new ApiHttpError({
            status: 401,
            message: "Sessão indisponível.",
        });

    const path = "/bookings/notifications";
    let notifications: Notification[];
    if (isMockAuthEnabled) {
        const list =
            localStorage.getItem("cafuringa-role") === "producer"
                ? listReceivedBookings
                : listMyBookings;
        const { items } = await list({ signal });
        notifications = items
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .flatMap((item) =>
                item.status === "pendente"
                    ? []
                    : [
                          {
                              id: bookingUpdateId(item),
                              reservaId: item.id,
                              codigo: bookingCode(item.id),
                              experienciaNome: item.experience.name,
                              data: item.date,
                              horario: item.time,
                              participantes: item.participants,
                              status: item.status,
                              ...(item.payment
                                  ? { pagamento: item.payment.status }
                                  : {}),
                              ...(item.payment?.refund
                                  ? { devolucao: item.payment.refund }
                                  : {}),
                          },
                      ],
            );
    } else {
        const url = new URL(apiResourceUrl(path), window.location.origin);
        const local = ["localhost", "127.0.0.1", "[::1]"].includes(
            url.hostname,
        );
        if (url.protocol !== "https:" && !(import.meta.env.DEV && local)) {
            throw new Error("A consulta de pré-reserva exige HTTPS.");
        }
        notifications = await getApiClient().get<Notification[]>(path, {
            headers: { Authorization: `Bearer ${token}` },
            signal,
        });
    }
    return toBookingUpdates(notifications);
}
