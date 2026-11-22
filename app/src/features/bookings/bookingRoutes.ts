/**
 * Rotas da pré-reserva (HU44). Prefixo próprio: "/oferta/" já é usado
 * pelo detalhe das ofertas.
 */
export const BOOKING_SENT_ROUTE = "/pre-reserva-enviada";

/** Lista de pré-reservas: placeholder até a HU45 (rota do item "Pré-reservas"). */
export const BOOKINGS_LIST_ROUTE = "/reservas";
export const BOOKING_NOTIFICATIONS_ROUTE = "/notificacoes";

export function bookingConsultationRoute(id: string) {
    return `${BOOKINGS_LIST_ROUTE}/${encodeURIComponent(id)}`;
}

export function parseBookingConsultationRoute(path: string) {
    const match = /^\/reservas\/([^/?]+)$/.exec(path);
    if (!match) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}

export function bookingConsultationLoginRoute(id: string, producer: boolean) {
    return `/login/${producer ? "producer" : "consumer"}?${new URLSearchParams({ reserva: id })}`;
}

export function bookingConsultationReturnRoute(
    route: string,
    role: string | null,
) {
    if (role !== "consumer" && role !== "producer") return null;
    const id = new URLSearchParams(route.split("?")[1] ?? "").get("reserva");
    return id ? bookingConsultationRoute(id) : null;
}

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

const RETURN_PARAM = "pre-reserva";

/** Visitante vai ao login do consumidor e volta ao formulário (HU44 CA02). */
export function bookingLoginRoute(experienceId: string): string {
    return `/login/consumer?${new URLSearchParams({ [RETURN_PARAM]: experienceId })}`;
}

/** Depois do login: rota do formulário, se o login veio da pré-reserva. */
export function bookingReturnRoute(
    route: string,
    role: string | null,
): string | null {
    if (role !== "consumer") return null;
    const id = new URLSearchParams(route.split("?")[1] ?? "").get(RETURN_PARAM);
    return id ? bookingRoute(id) : null;
}

/** Detalhe da experiência, no mesmo formato usado pelo OfferCards. */
export function experienceDetailsRoute(experienceId: string): string {
    return `/oferta/${encodeURIComponent(experienceId)}?tipo=experiencia`;
}

/** Botão no detalhe (HU44 CA01): visitante (vai ao login) e consumidor. */
export function canRequestBooking(role: string | null): boolean {
    return role === null || role === "consumer";
}
