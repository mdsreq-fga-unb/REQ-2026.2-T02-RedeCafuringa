import { apiResourceUrl, ApiHttpError, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import type { components } from "@/shared/api/schema";
import { listMyBookings, listReceivedBookings } from "./bookingQueryService";
import { bookingCode } from "./bookingDetails";

type Notification = components["schemas"]["BookingNotificationResponse"];
export type BookingUpdate = Notification & { nova: boolean };

function readKey(id: string) {
    const role = localStorage.getItem("cafuringa-role");
    const userId = localStorage.getItem("cafuringa-user-id");
    return `cafuringa-booking-update:${role}:${userId}:${id}`;
}

export function markBookingUpdateRead(id: string) {
    localStorage.setItem(readKey(id), "read");
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
                              id: `${item.id}:${item.status}`,
                              reservaId: item.id,
                              codigo: bookingCode(item.id),
                              experienciaNome: item.experience.name,
                              data: item.date,
                              horario: item.time,
                              participantes: item.participants,
                              status: item.status,
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
    if (!Array.isArray(notifications))
        throw new Error("Lista de notificações inválida.");
    return notifications.map(
        ({
            id,
            reservaId,
            codigo,
            experienciaNome,
            data,
            horario,
            participantes,
            status,
        }) => {
            if (
                ![id, reservaId, codigo, experienciaNome, data, horario].every(
                    (value) => typeof value === "string" && value,
                ) ||
                !Number.isSafeInteger(participantes) ||
                participantes < 1 ||
                !["aceita", "recusada", "cancelada"].includes(status)
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
                nova: localStorage.getItem(readKey(id)) !== "read",
            };
        },
    );
}
