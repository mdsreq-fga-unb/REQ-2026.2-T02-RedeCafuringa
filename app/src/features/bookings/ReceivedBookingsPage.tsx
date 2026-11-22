import { useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import {
    getReceivedBooking,
    listReceivedBookings,
    receivedBookingError,
    respondToBooking,
    type BookingDecision,
    type ReceivedBooking,
} from "./receivedBookingsService";
import type { BookingStatus, PaymentMethod } from "./bookingTypes";
import { RECEIVED_BOOKINGS_ROUTE, receivedBookingRoute } from "./bookingRoutes";
import "./bookings.css";
import "./receivedBookings.css";

const statusLabels: Record<BookingStatus, string> = {
    pendente: "Pendente",
    aceita: "Aceito",
    recusada: "Recusado",
    cancelada: "Cancelado",
};

const statusIcons: Record<BookingStatus, string> = {
    pendente: "◷",
    aceita: "✓",
    recusada: "×",
    cancelada: "×",
};

const paymentLabels: Record<PaymentMethod, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
};

const monthLabels = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
];
const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const formatTime = (time: string) => time.replace(":", "h");
const accessDenied = "Você não tem permissão para acessar esta solicitação.";

type Navigate = (path: string) => void;

export function ReceivedBookingsPage({ onNavigate }: { onNavigate: Navigate }) {
    const [bookings, setBookings] = useState<ReceivedBooking[] | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        void listReceivedBookings(controller.signal).then(
            (items) => {
                if (!controller.signal.aborted) setBookings(items);
            },
            (failure: unknown) => {
                if (controller.signal.aborted) return;
                const status = receivedBookingError(failure);
                setError(
                    status === 403
                        ? accessDenied
                        : status === 401
                          ? "Sua sessão expirou. Entre novamente para consultar as pré-reservas."
                          : "Não foi possível carregar as pré-reservas.",
                );
            },
        );
        return () => controller.abort();
    }, [attempt]);

    const pending =
        bookings?.filter((item) => item.status === "pendente").length ?? 0;
    return (
        <section className="login-page booking-page received-bookings">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            <h1>Notificações</h1>
            {error ? (
                <>
                    <p className="received-error" role="alert">
                        {error}
                    </p>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setError("");
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Tentar novamente
                    </ActionButton>
                </>
            ) : bookings === null ? (
                <p role="status">Carregando solicitações…</p>
            ) : bookings.length === 0 ? (
                <p>Você ainda não recebeu solicitações de pré-reserva.</p>
            ) : (
                <>
                    {pending > 0 && (
                        <p className="booking-notice" role="status">
                            {pending === 1
                                ? "1 solicitação de pré-reserva aguarda sua resposta."
                                : `${pending} solicitações de pré-reserva aguardam sua resposta.`}
                        </p>
                    )}
                    <ul className="received-list">
                        {bookings.map((item) => {
                            const [, month, day] = item.data.split("-");
                            const action =
                                item.status === "pendente"
                                    ? "Responder"
                                    : "Ver detalhes";
                            const path = receivedBookingRoute(item.id);
                            return (
                                <li key={item.id} className="received-card">
                                    <p className="received-card-label">
                                        Nova solicitação
                                    </p>
                                    <h2>{item.consumidorNome}</h2>
                                    <p
                                        className="received-status"
                                        data-status={item.status}
                                    >
                                        {statusLabels[item.status]}
                                    </p>
                                    <p>
                                        {day} {monthLabels[Number(month) - 1]} •{" "}
                                        {formatTime(item.horario)} •{" "}
                                        {item.participantes}{" "}
                                        {item.participantes === 1
                                            ? "pessoa"
                                            : "pessoas"}
                                    </p>
                                    <a
                                        href={`#${path}`}
                                        aria-label={`${action}: ${item.consumidorNome}, ${item.codigo}`}
                                        onClick={(event) => {
                                            if (
                                                event.ctrlKey ||
                                                event.metaKey ||
                                                event.shiftKey ||
                                                event.altKey
                                            )
                                                return;
                                            event.preventDefault();
                                            onNavigate(path);
                                        }}
                                    >
                                        {action}{" "}
                                        <span aria-hidden="true">→</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </section>
    );
}

export function ReceivedBookingPage({
    id,
    onNavigate,
}: {
    id: string;
    onNavigate: Navigate;
}) {
    const [booking, setBooking] = useState<ReceivedBooking | null>(null);
    const [message, setMessage] = useState("");
    const [confirmingRefusal, setConfirmingRefusal] = useState(false);
    const [sent, setSent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const submission = useRef<AbortController | null>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const loaded = booking !== null;

    useEffect(() => {
        const controller = new AbortController();
        void getReceivedBooking(id, controller.signal).then(
            (item) => {
                if (!controller.signal.aborted) setBooking(item);
            },
            (failure: unknown) => {
                if (controller.signal.aborted) return;
                const status = receivedBookingError(failure);
                setBlocked(status === 401 || status === 403 || status === 404);
                setError(
                    status === 403
                        ? accessDenied
                        : status === 401
                          ? "Sua sessão expirou. Entre novamente para consultar a solicitação."
                          : status === 404
                            ? "Solicitação indisponível."
                            : "Não foi possível carregar a solicitação.",
                );
            },
        );
        return () => {
            controller.abort();
            submission.current?.abort();
        };
    }, [id, attempt]);

    useEffect(() => {
        if (loaded || sent) heading.current?.focus();
    }, [loaded, confirmingRefusal, sent]);

    const backToList = () => onNavigate(RECEIVED_BOOKINGS_ROUTE);
    const backFromRefusal = () => {
        setError("");
        setConfirmingRefusal(false);
    };

    const send = async (decision: BookingDecision) => {
        if (booking?.status !== "pendente" || blocked || submission.current)
            return;
        const controller = new AbortController();
        submission.current = controller;
        setSaving(true);
        setError("");
        try {
            await respondToBooking(id, decision, message, controller.signal);
            if (controller.signal.aborted) return;
            setMessage("");
            setBooking(null);
            setSent(true);
        } catch (failure) {
            if (controller.signal.aborted) return;
            const status = receivedBookingError(failure);
            if (status === 409 || status === 410) {
                setBlocked(true);
                setConfirmingRefusal(false);
                setError(
                    "A solicitação já foi respondida ou está indisponível.",
                );
                try {
                    const current = await getReceivedBooking(
                        id,
                        controller.signal,
                    );
                    if (!controller.signal.aborted) setBooking(current);
                } catch {
                    if (!controller.signal.aborted) setBooking(null);
                }
            } else if (status === 401 || status === 403 || status === 404) {
                setBlocked(true);
                setMessage("");
                setBooking(null);
                setConfirmingRefusal(false);
                setError(
                    status === 403
                        ? accessDenied
                        : status === 401
                          ? "Sua sessão expirou. Entre novamente para responder."
                          : "Solicitação indisponível.",
                );
            } else {
                setError(
                    "A resposta não foi registrada. Confira os dados e tente novamente.",
                );
            }
        } finally {
            if (!controller.signal.aborted) {
                submission.current = null;
                setSaving(false);
            }
        }
    };

    return (
        <section className="login-page booking-page received-bookings received-detail">
            <BackButton
                label={
                    !sent && confirmingRefusal ? "Voltar ao detalhe" : "Voltar"
                }
                onClick={
                    !sent && confirmingRefusal ? backFromRefusal : backToList
                }
                disabled={saving}
            />
            {sent ? (
                <>
                    <div className="booking-sent-icon" aria-hidden="true">
                        ✓
                    </div>
                    <h1 ref={heading} tabIndex={-1}>
                        Resposta enviada
                    </h1>
                    <p>
                        O status da solicitação foi atualizado.{" "}
                        {isMockAuthEnabled
                            ? "A notificação é simulada no modo demonstração."
                            : "Quem solicitou receberá uma notificação."}
                    </p>
                    <div className="received-actions">
                        <ActionButton
                            variant="orange"
                            type="button"
                            onClick={() => onNavigate("/explorar")}
                        >
                            Voltar ao painel
                        </ActionButton>
                        <ActionButton
                            variant="outline"
                            type="button"
                            onClick={backToList}
                        >
                            Ver pré-reservas
                        </ActionButton>
                    </div>
                </>
            ) : booking ? (
                <>
                    <div
                        className="booking-sent-icon received-status"
                        data-status={
                            confirmingRefusal ? "recusada" : booking.status
                        }
                        aria-hidden="true"
                    >
                        {
                            statusIcons[
                                confirmingRefusal ? "recusada" : booking.status
                            ]
                        }
                    </div>
                    <h1
                        ref={heading}
                        tabIndex={-1}
                        className="received-status"
                        data-status={
                            confirmingRefusal ? "recusada" : booking.status
                        }
                    >
                        {confirmingRefusal
                            ? "Cancelar a solicitação?"
                            : statusLabels[booking.status]}
                    </h1>
                    <p># Nº {booking.codigo}</p>
                    <h2>
                        {confirmingRefusal
                            ? booking.experienciaNome
                            : booking.consumidorNome}
                    </h2>
                    <div className="received-summary">
                        {booking.propriedade && confirmingRefusal && (
                            <p>{booking.propriedade}</p>
                        )}
                        <p>{booking.data.split("-").reverse().join("/")}</p>
                        <p>{formatTime(booking.horario)}</p>
                        <p>
                            {booking.participantes}{" "}
                            {booking.participantes === 1
                                ? "participante"
                                : "participantes"}
                        </p>
                        <p>{currency.format(booking.valorTotal)}</p>
                        {!confirmingRefusal && (
                            <p>{paymentLabels[booking.formaPagamento]}</p>
                        )}
                    </div>
                    {!confirmingRefusal && booking.mensagem && (
                        <>
                            <h2>Mensagem de {booking.consumidorNome}</h2>
                            <p className="received-message">
                                {booking.mensagem}
                            </p>
                        </>
                    )}
                    {error && (
                        <p className="received-error" role="alert">
                            {error}
                        </p>
                    )}
                    {confirmingRefusal ? (
                        <>
                            {message.trim() && (
                                <>
                                    <h2>
                                        Mensagem para {booking.consumidorNome}
                                    </h2>
                                    <p className="received-reply received-message">
                                        {message}
                                    </p>
                                </>
                            )}
                            <p className="received-error">
                                A pré-reserva de{" "}
                                {booking.data.split("-").reverse().join("/")}{" "}
                                será rejeitada. O consumidor será informado.
                            </p>
                            <div className="received-actions">
                                <ActionButton
                                    variant="orange"
                                    className="received-danger"
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void send("recusada")}
                                >
                                    Sim, cancelar solicitação
                                </ActionButton>
                                <ActionButton
                                    variant="orange"
                                    type="button"
                                    disabled={saving}
                                    onClick={backFromRefusal}
                                >
                                    Voltar
                                </ActionButton>
                            </div>
                        </>
                    ) : booking.status === "pendente" && !blocked ? (
                        <>
                            <label
                                className="received-reply-label"
                                htmlFor="booking-reply"
                            >
                                Mensagem para {booking.consumidorNome}
                            </label>
                            <textarea
                                id="booking-reply"
                                className="text-input"
                                rows={2}
                                value={message}
                                disabled={saving}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                            />
                            <div className="received-actions">
                                <ActionButton
                                    variant="green"
                                    className="received-accept"
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void send("aceita")}
                                >
                                    Aceitar pré-reserva
                                </ActionButton>
                                <ActionButton
                                    variant="orange"
                                    className="received-danger"
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                        setError("");
                                        setConfirmingRefusal(true);
                                    }}
                                >
                                    Recusar solicitação
                                </ActionButton>
                            </div>
                        </>
                    ) : booking.mensagemResposta ? (
                        <>
                            <h2>Mensagem para {booking.consumidorNome}</h2>
                            <p className="received-reply received-message">
                                {booking.mensagemResposta}
                            </p>
                        </>
                    ) : null}
                    {saving && <p role="status">Registrando resposta…</p>}
                </>
            ) : (
                <>
                    <h1>Solicitação de pré-reserva</h1>
                    {error ? (
                        <>
                            <p className="received-error" role="alert">
                                {error}
                            </p>
                            {!blocked && (
                                <ActionButton
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setAttempt((value) => value + 1);
                                    }}
                                >
                                    Tentar novamente
                                </ActionButton>
                            )}
                        </>
                    ) : (
                        <p role="status">Carregando solicitação…</p>
                    )}
                </>
            )}
        </section>
    );
}
