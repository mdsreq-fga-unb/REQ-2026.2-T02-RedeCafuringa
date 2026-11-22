import { useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { BookingCancelError, cancelBooking } from "./bookingCancelService";
import {
    bookingStatusLabel,
    formatBookingDate,
    formatBookingTime,
    formatParticipants,
    type BookingDetail,
} from "./bookingDetails";
import { getBooking } from "./bookingQueryService";
import { BookingSessionError } from "./bookingService";
import type { Booking } from "./bookingTypes";
import "./bookings.css";

type LoadBooking = (
    id: string,
    options: { signal?: AbortSignal },
) => Promise<BookingDetail | null>;
type CancelBooking = (id: string) => Promise<Booking>;

type BookingCancelPageProps = {
    id: string;
    onNavigate: (path: string) => void;
    load?: LoadBooking;
    cancel?: CancelBooking;
};

type View =
    | { kind: "loading" }
    | { kind: "load-error" }
    | { kind: "session" }
    | { kind: "missing" }
    | { kind: "not-pending"; booking: BookingDetail }
    | { kind: "confirm"; booking: BookingDetail; failed: boolean }
    | { kind: "blocked"; message: string }
    | { kind: "done"; booking: BookingDetail };

const NOT_DONE =
    "O cancelamento não foi concluído. Sua pré-reserva continua aguardando resposta. Verifique a conexão e tente novamente.";

function Summary({ booking }: { booking: BookingDetail }) {
    const rows: Array<[string, string]> = [
        ["Local", booking.experience.local],
        ["Data", formatBookingDate(booking.date)],
        ["Horário", formatBookingTime(booking.time)],
        ["Participantes", formatParticipants(booking.participants)],
    ];
    return (
        <ul className="booking-detail-list" aria-label="Dados da solicitação">
            {rows
                .filter(([, value]) => value)
                .map(([label, value]) => (
                    <li key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </li>
                ))}
        </ul>
    );
}

/**
 * HU46: confirmação do cancelamento (CA02). Desistir não chama a API (CA04);
 * confirmar cancela uma única vez (CA03) e, se falhar, avisa que nada mudou
 * (CA07).
 */
export function BookingCancelPage({
    id,
    onNavigate,
    load = getBooking,
    cancel = cancelBooking,
}: BookingCancelPageProps) {
    const [view, setView] = useState<View>({ kind: "loading" });
    const [attempt, setAttempt] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    // Bloqueia o segundo clique antes de o React redesenhar o botão.
    const sending = useRef(false);
    const detailRoute = `/reservas/${encodeURIComponent(id)}`;

    useEffect(() => {
        const controller = new AbortController();
        load(id, { signal: controller.signal }).then(
            (booking) => {
                if (controller.signal.aborted) return;
                if (!booking) setView({ kind: "missing" });
                else if (booking.status !== "pendente")
                    setView({ kind: "not-pending", booking });
                else setView({ kind: "confirm", booking, failed: false });
            },
            (error: unknown) => {
                if (controller.signal.aborted) return;
                setView({
                    kind:
                        error instanceof BookingSessionError
                            ? "session"
                            : "load-error",
                });
            },
        );
        return () => controller.abort();
        // Busca de novo só ao abrir outra pré-reserva ou ao tentar de novo.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, attempt]);

    async function confirm(booking: BookingDetail) {
        if (sending.current) return;
        sending.current = true;
        setSubmitting(true);
        try {
            await cancel(id);
            setView({ kind: "done", booking });
        } catch (error) {
            if (error instanceof BookingSessionError)
                setView({ kind: "session" });
            else if (
                error instanceof BookingCancelError &&
                error.reason === "nao-encontrada"
            )
                setView({ kind: "missing" });
            else if (error instanceof BookingCancelError)
                setView({ kind: "blocked", message: error.message });
            else setView({ kind: "confirm", booking, failed: true });
        } finally {
            sending.current = false;
            setSubmitting(false);
        }
    }

    return (
        <section
            className="booking-page booking-cancel-page"
            aria-busy={view.kind === "loading" || submitting}
        >
            {view.kind !== "done" && (
                <BackButton
                    label="Voltar"
                    onClick={() => onNavigate(detailRoute)}
                />
            )}

            {view.kind === "loading" && (
                <p role="status">Carregando pré-reserva…</p>
            )}

            {view.kind === "load-error" && (
                <div role="alert" className="booking-list-alert">
                    <p>
                        Não foi possível carregar a pré-reserva. Verifique a
                        conexão e tente novamente.
                    </p>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setView({ kind: "loading" });
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Tentar novamente
                    </ActionButton>
                </div>
            )}

            {view.kind === "session" && (
                <div role="alert" className="booking-list-alert">
                    <p>
                        Sua sessão expirou. Entre novamente para cancelar a
                        pré-reserva.
                    </p>
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={() => onNavigate("/login/consumer")}
                    >
                        Entrar
                    </ActionButton>
                </div>
            )}

            {view.kind === "missing" && (
                <div className="booking-list-empty">
                    <h1>Pré-reserva não encontrada</h1>
                    <p>Ela não existe ou não está vinculada à sua conta.</p>
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={() => onNavigate("/reservas")}
                    >
                        Ver minhas pré-reservas
                    </ActionButton>
                </div>
            )}

            {view.kind === "not-pending" && (
                <div className="booking-list-empty">
                    <h1>Não é possível cancelar</h1>
                    <p>
                        {`Só é possível cancelar pré-reservas que aguardam resposta. Situação atual: ${bookingStatusLabel(view.booking.status)}.`}
                    </p>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => onNavigate(detailRoute)}
                    >
                        Ver pré-reserva
                    </ActionButton>
                </div>
            )}

            {view.kind === "blocked" && (
                <div className="booking-list-empty">
                    <h1>Não é possível cancelar</h1>
                    <p role="alert">{view.message}</p>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => onNavigate(detailRoute)}
                    >
                        Ver pré-reserva
                    </ActionButton>
                </div>
            )}

            {view.kind === "confirm" && (
                <>
                    <div className="booking-cancel-icon" aria-hidden="true">
                        ✕
                    </div>
                    <h1>Cancelar solicitação?</h1>
                    <h2>{view.booking.experience.name}</h2>
                    <Summary booking={view.booking} />
                    <p className="booking-cancel-warning">
                        {`Sua pré-reserva de ${formatBookingDate(view.booking.date)} será cancelada. A produtora verá a solicitação como cancelada.`}
                    </p>
                    {view.failed && (
                        <p role="alert" className="form-alert">
                            {NOT_DONE}
                        </p>
                    )}
                    <div className="login-actions">
                        <button
                            type="button"
                            className="button booking-cancel-button"
                            disabled={submitting}
                            onClick={() => void confirm(view.booking)}
                        >
                            Sim, cancelar solicitação
                        </button>
                        <ActionButton
                            variant="outline"
                            type="button"
                            disabled={submitting}
                            onClick={() => onNavigate(detailRoute)}
                        >
                            Manter solicitação
                        </ActionButton>
                    </div>
                </>
            )}

            {view.kind === "done" && (
                <>
                    <div className="booking-sent-icon" aria-hidden="true">
                        ✓
                    </div>
                    <h1>Solicitação cancelada</h1>
                    <p>
                        {`Você cancelou a pré-reserva de ${view.booking.experience.name}.`}
                    </p>
                    <div className="login-actions">
                        <ActionButton
                            variant="orange"
                            type="button"
                            onClick={() => onNavigate("/reservas")}
                        >
                            Voltar às pré-reservas
                        </ActionButton>
                        <ActionButton
                            variant="outline"
                            type="button"
                            onClick={() => onNavigate("/experiencias")}
                        >
                            Descobrir outras experiências
                        </ActionButton>
                    </div>
                </>
            )}
        </section>
    );
}
