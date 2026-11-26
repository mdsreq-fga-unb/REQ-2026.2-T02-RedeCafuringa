import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { ApiHttpError } from "@/shared/api";
import { bookingConsultationRoute } from "./bookingRoutes";
import { formatBookingDate, formatBookingTime } from "./bookingDetails";
import {
    bookingUpdateLabel,
    listBookingUpdates,
    markBookingUpdateRead,
    type BookingUpdate,
} from "./bookingNotificationsService";
import "./bookings.css";
import "./bookingNotifications.css";

function UpdateList({
    updates,
    onNavigate,
}: {
    updates: BookingUpdate[];
    onNavigate: (path: string) => void;
}) {
    if (!updates.length) return <p>Nenhuma atualização de pré-reserva.</p>;
    const role =
        localStorage.getItem("cafuringa-role") === "producer"
            ? "producer"
            : "consumer";

    return (
        <>
            {updates.some((item) => item.nova) && (
                <p className="booking-notice" role="status">
                    Você tem novas atualizações de suas reservas.
                </p>
            )}
            <ul className="booking-updates">
                {updates.map((item) => {
                    const route = bookingConsultationRoute(item.reservaId);
                    return (
                        <li key={item.id} className="booking-update">
                            <div className="booking-update-meta">
                                <span>{item.codigo}</span>
                                {item.nova && (
                                    <span className="booking-update-badge">
                                        Nova atualização
                                    </span>
                                )}
                            </div>
                            <h2>{item.experienciaNome}</h2>
                            <p>
                                {formatBookingDate(item.data)} •{" "}
                                {formatBookingTime(item.horario)} •{" "}
                                {item.participantes}{" "}
                                {item.participantes === 1
                                    ? "pessoa"
                                    : "pessoas"}
                            </p>
                            <p
                                className="booking-update-status"
                                data-status={item.status}
                            >
                                {bookingUpdateLabel(item, role)}
                            </p>
                            <a
                                href={`#${route}`}
                                aria-label={`Ver detalhes de ${item.experienciaNome}, ${item.codigo}`}
                                onClick={(event) => {
                                    if (
                                        event.ctrlKey ||
                                        event.metaKey ||
                                        event.altKey ||
                                        event.shiftKey
                                    )
                                        return;
                                    event.preventDefault();
                                    markBookingUpdateRead(item.id);
                                    onNavigate(route);
                                }}
                            >
                                Ver detalhes <span aria-hidden="true">→</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

export function BookingNotificationsPage({
    onNavigate,
    onUpdatesLoaded,
    updates,
}: {
    updates: BookingUpdate[];
    onUpdatesLoaded: (updates: BookingUpdate[]) => void;
    onNavigate: (path: string) => void;
}) {
    const [state, setState] = useState<"ready" | "error" | "session" | null>(
        null,
    );
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        void listBookingUpdates(controller.signal).then(
            (updates) => {
                if (controller.signal.aborted) return;
                setState("ready");
                onUpdatesLoaded(updates);
            },
            (error: unknown) => {
                if (!controller.signal.aborted)
                    setState(
                        error instanceof ApiHttpError && error.status === 401
                            ? "session"
                            : "error",
                    );
            },
        );
        return () => controller.abort();
    }, [attempt, onUpdatesLoaded]);

    return (
        <section
            className="login-page booking-page booking-notifications"
            aria-busy={state === null}
        >
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            <h1>Notificações</h1>
            {state === null ? (
                <p role="status">Carregando notificações…</p>
            ) : state === "error" ? (
                <>
                    <p className="booking-notification-error" role="alert">
                        Não foi possível carregar as notificações.
                    </p>
                    <ActionButton
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setState(null);
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Tentar novamente
                    </ActionButton>
                </>
            ) : state === "session" ? (
                <p role="alert">
                    Sua sessão expirou. Entre novamente para consultar as
                    notificações.
                </p>
            ) : (
                <UpdateList updates={updates} onNavigate={onNavigate} />
            )}
        </section>
    );
}
