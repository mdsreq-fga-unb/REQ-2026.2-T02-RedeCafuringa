/**
 * Rotas da pré-reserva (HU44). Prefixo próprio: "/oferta/" já é usado
 * pelo detalhe das ofertas.
 */
export const BOOKING_SENT_ROUTE = "/pre-reserva-enviada";

/** Lista de pré-reservas: placeholder até a HU45 (rota do item "Pré-reservas"). */
export const BOOKINGS_LIST_ROUTE = "/reservas";

export function bookingRoute(experienceId: string): string {
    return `/pre-reserva/${encodeURIComponent(experienceId)}`;
}

export function parseBookingRoute(route: string): string | null {
    const match = /^\/pre-reserva\/([^/]+)$/.exec(route.split("?")[0]);
    if (!match) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}

export type BookingAccess = "allowed" | "login" | "blocked";

export type BookingSession = {
    role: string | null;
    hasToken: boolean;
    /** Modo demonstração: não exige token, como o adminBlocked do App. */
    mock: boolean;
};

/** Quem pode abrir o formulário: visitante vai ao login; só consumidor entra. */
export function bookingAccess({
    role,
    hasToken,
    mock,
}: BookingSession): BookingAccess {
    if (role === null) return "login";
    if (role !== "consumer") return "blocked";
    return mock || hasToken ? "allowed" : "login";
}
