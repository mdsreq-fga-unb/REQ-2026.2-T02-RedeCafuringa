import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import {
    bookingStatusLabel,
    formatBookingDate,
    formatBookingTime,
    formatParticipants,
    type BookingDetail,
} from "./bookingDetails";
import {
    listMyBookings,
    listReceivedBookings,
    type BookingPage,
} from "./bookingQueryService";
import { BookingSessionError } from "./bookingService";
import "./bookings.css";

type Role = "consumer" | "producer";

type LoadBookings = (options: { signal?: AbortSignal }) => Promise<BookingPage>;

type BookingsPageProps = {
    role: Role;
    onNavigate: (path: string) => void;
    load?: LoadBookings;
};

type State =
    | { status: "loading" }
    | { status: "ready"; page: BookingPage }
    | { status: "error" }
    | { status: "session" };

const TEXTS: Record<Role, { title: string; empty: string }> = {
    consumer: {
        title: "Minhas pré-reservas",
        empty: "Você ainda não tem pré-reservas.",
    },
    producer: {
        title: "Pré-reservas recebidas",
        empty: "Ainda não há pré-reservas para as suas experiências.",
    },
};

function BookingCard({
    booking,
    role,
    onOpen,
}: {
    booking: BookingDetail;
    role: Role;
    onOpen: () => void;
}) {
    const titleId = `booking-${booking.id}-title`;
    return (
        <article className="booking-card" aria-labelledby={titleId}>
            <p className="booking-card-kind">Pré-reserva</p>
            <h2 id={titleId}>{booking.experience.name}</h2>
            <p>
                {`${formatBookingDate(booking.date)} · ${formatBookingTime(booking.time)} · ${formatParticipants(booking.participants)}`}
            </p>
            {role === "producer" && (
                <p>{`Solicitada por ${booking.counterpart.name}`}</p>
            )}
            <p className={`booking-status booking-status--${booking.status}`}>
                {bookingStatusLabel(booking.status)}
            </p>
            <button
                type="button"
                className="text-action"
                aria-label={`Ver solicitação: ${booking.experience.name}`}
                onClick={onOpen}
            >
                Ver solicitação <span aria-hidden="true">→</span>
            </button>
        </article>
    );
}

/**
 * HU45: pré-reservas de quem está logado. A consumidora vê as que enviou
 * (CA02); a produtora, as recebidas para as suas experiências (CA03).
 */
export function BookingsPage({ role, onNavigate, load }: BookingsPageProps) {
    const [state, setState] = useState<State>({ status: "loading" });
    const [attempt, setAttempt] = useState(0);
    const loader =
        load ?? (role === "producer" ? listReceivedBookings : listMyBookings);

    useEffect(() => {
        const controller = new AbortController();
        loader({ signal: controller.signal }).then(
            (page) => {
                if (!controller.signal.aborted)
                    setState({ status: "ready", page });
            },
            (error: unknown) => {
                if (controller.signal.aborted) return;
                setState({
                    status:
                        error instanceof BookingSessionError
                            ? "session"
                            : "error",
                });
            },
        );
        return () => controller.abort();
        // O carregador muda a cada renderização; recarrega só ao tentar de novo.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt]);

    const texts = TEXTS[role];
    return (
        <section
            className="booking-page booking-list-page"
            aria-labelledby="bookings-title"
            aria-busy={state.status === "loading"}
        >
            <h1 id="bookings-title">{texts.title}</h1>

            {state.status === "loading" && (
                <p role="status">Carregando pré-reservas…</p>
            )}

            {state.status === "error" && (
                <div role="alert" className="booking-list-alert">
                    <p>
                        Não foi possível carregar as pré-reservas. Verifique a
                        conexão e tente novamente.
                    </p>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setState({ status: "loading" });
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Tentar novamente
                    </ActionButton>
                </div>
            )}

            {state.status === "session" && (
                <div role="alert" className="booking-list-alert">
                    <p>
                        Sua sessão expirou. Entre novamente para ver suas
                        pré-reservas.
                    </p>
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={() => onNavigate(`/login/${role}`)}
                    >
                        Entrar
                    </ActionButton>
                </div>
            )}

            {state.status === "ready" && state.page.items.length === 0 && (
                <div role="status" className="booking-list-empty">
                    <p>{texts.empty}</p>
                    {role === "consumer" && (
                        <ActionButton
                            variant="orange"
                            type="button"
                            onClick={() => onNavigate("/experiencias")}
                        >
                            Explorar experiências
                        </ActionButton>
                    )}
                </div>
            )}

            {state.status === "ready" && state.page.items.length > 0 && (
                <>
                    <ul className="booking-list">
                        {state.page.items.map((booking) => (
                            <li key={booking.id}>
                                <BookingCard
                                    booking={booking}
                                    role={role}
                                    onOpen={() =>
                                        onNavigate(
                                            `/reservas/${encodeURIComponent(booking.id)}`,
                                        )
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                    {state.page.total > state.page.items.length && (
                        <p className="booking-list-count">
                            {`Mostrando ${state.page.items.length} de ${state.page.total}`}
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
