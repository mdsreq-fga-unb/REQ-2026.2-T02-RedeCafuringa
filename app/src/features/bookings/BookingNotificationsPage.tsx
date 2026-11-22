import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { WhatsAppContactLink, whatsAppContactUrl } from "@/features/contact";
import { ApiHttpError } from "@/shared/api";
import {
    BOOKING_NOTIFICATIONS_ROUTE,
    bookingConsultationRoute,
    bookingRoute,
} from "./bookingRoutes";
import {
    getConsultedBooking,
    listBookingUpdates,
    type BookingUpdate,
    type ConsultedBooking,
} from "./bookingNotificationsService";
import type { BookingStatus, PaymentMethod } from "./bookingTypes";
import "./bookings.css";
import "./bookingNotifications.css";

const statusLabel: Record<BookingStatus, string> = {
    pendente: "Aguardando resposta",
    aceita: "Pré-reserva aceita",
    recusada: "Pré-reserva recusada",
    cancelada: "Pré-reserva cancelada",
};

const updateLabel: Record<BookingUpdate["status"], string> = {
    aceita: "Aceito",
    recusada: "Recusado",
    cancelada: "Cancelado",
};

const paymentLabel: Record<PaymentMethod, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
};

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const formatDate = (date: string) => date.split("-").reverse().join("/");
const formatTime = (time: string) => time.replace(":", "h");

type Content = BookingUpdate[] | ConsultedBooking;
type LoadState =
    { content: Content } | { error: string; retry: boolean } | null;

function loadError(
    error: unknown,
    detail: boolean,
): NonNullable<Extract<LoadState, { error: string }>> {
    switch (error instanceof ApiHttpError ? error.status : undefined) {
        case 401:
            return {
                error: "Sua sessão expirou. Entre novamente para consultar as pré-reservas.",
                retry: false,
            };
        case 403:
            return {
                error: "Você não tem permissão para consultar estas informações.",
                retry: false,
            };
        case 404:
            if (detail)
                return {
                    error: "Pré-reserva indisponível ou não encontrada.",
                    retry: false,
                };
    }
    return {
        error: detail
            ? "Não foi possível carregar a pré-reserva."
            : "Não foi possível carregar as notificações.",
        retry: true,
    };
}

function UpdateList({
    updates,
    onNavigate,
}: {
    updates: BookingUpdate[];
    onNavigate: (path: string) => void;
}) {
    if (!updates.length) return <p>Nenhuma atualização de pré-reserva.</p>;

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
                                {formatDate(item.data)} •{" "}
                                {formatTime(item.horario)} •{" "}
                                {item.participantes}{" "}
                                {item.participantes === 1
                                    ? "pessoa"
                                    : "pessoas"}
                            </p>
                            <p
                                className="booking-update-status"
                                data-status={item.status}
                            >
                                {updateLabel[item.status]}
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

function BookingDetail({
    booking,
    consumer,
    onNavigate,
}: {
    booking: ConsultedBooking;
    consumer: boolean;
    onNavigate: (path: string) => void;
}) {
    const { status } = booking;
    const contact =
        consumer && status === "aceita"
            ? whatsAppContactUrl(
                  booking.telefonePublico,
                  booking.experienciaNome,
              )
            : undefined;
    const icon = status === "pendente" ? "◷" : status === "aceita" ? "✓" : "×";
    return (
        <>
            <div className="booking-detail-card">
                <header className="booking-detail-status" data-status={status}>
                    <span aria-hidden="true">{icon}</span>
                    <h1>{statusLabel[status]}</h1>
                    <span className="booking-detail-code">
                        {booking.codigo}
                    </span>
                </header>
                <div className="booking-detail-body">
                    <h2>{booking.experienciaNome}</h2>
                    {booking.propriedade && <p>{booking.propriedade}</p>}
                    <dl className="booking-detail-facts">
                        <div>
                            <dt>Data</dt>
                            <dd>
                                <time dateTime={booking.data}>
                                    {formatDate(booking.data)}
                                </time>
                            </dd>
                        </div>
                        <div>
                            <dt>Horário</dt>
                            <dd>
                                <time dateTime={booking.horario}>
                                    {formatTime(booking.horario)}
                                </time>
                            </dd>
                        </div>
                        <div>
                            <dt>Grupo</dt>
                            <dd>
                                {booking.participantes}{" "}
                                {booking.participantes === 1
                                    ? "participante"
                                    : "participantes"}
                            </dd>
                        </div>
                        <div>
                            <dt>Valor total</dt>
                            <dd>{currency.format(booking.valorTotal)}</dd>
                        </div>
                        <div>
                            <dt>Forma de pagamento</dt>
                            <dd>{paymentLabel[booking.formaPagamento]}</dd>
                        </div>
                    </dl>
                </div>
            </div>
            {booking.mensagem && (status === "pendente" || !consumer) && (
                <section className="booking-detail-message">
                    <h2>
                        {consumer ? "Sua mensagem" : "Mensagem do consumidor"}
                    </h2>
                    <p>{booking.mensagem}</p>
                </section>
            )}
            {booking.mensagemResposta && (
                <section className="booking-detail-message">
                    <h2>
                        {consumer ? "Mensagem do produtor" : "Sua resposta"}
                    </h2>
                    <p>{booking.mensagemResposta}</p>
                </section>
            )}
            {contact && (
                <div className="booking-detail-actions">
                    <WhatsAppContactLink url={contact} />
                </div>
            )}
            {consumer && status === "recusada" && (
                <div className="booking-detail-actions">
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={() =>
                            onNavigate(bookingRoute(booking.experienciaId))
                        }
                    >
                        Fazer nova pré-reserva
                    </ActionButton>
                </div>
            )}
        </>
    );
}

export function BookingNotificationsPage({
    id,
    consumer,
    onNavigate,
}: {
    id: string | null;
    consumer: boolean;
    onNavigate: (path: string) => void;
}) {
    const [state, setState] = useState<LoadState>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const request = id
            ? getConsultedBooking(id, controller.signal)
            : listBookingUpdates(controller.signal);
        void request.then(
            (content) => {
                if (!controller.signal.aborted) setState({ content });
            },
            (error: unknown) => {
                if (!controller.signal.aborted)
                    setState(loadError(error, Boolean(id)));
            },
        );
        return () => controller.abort();
    }, [id, attempt]);

    return (
        <section className="login-page booking-page booking-notifications">
            <BackButton
                label="Voltar"
                onClick={() =>
                    onNavigate(id ? BOOKING_NOTIFICATIONS_ROUTE : "/explorar")
                }
            />
            {!id && <h1>Notificações</h1>}
            {state === null ? (
                <p role="status">
                    {id
                        ? "Carregando pré-reserva…"
                        : "Carregando notificações…"}
                </p>
            ) : "error" in state ? (
                <>
                    {id && <h1>Detalhe da pré-reserva</h1>}
                    <p className="booking-notification-error" role="alert">
                        {state.error}
                    </p>
                    {state.retry && (
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
                    )}
                </>
            ) : Array.isArray(state.content) ? (
                <UpdateList updates={state.content} onNavigate={onNavigate} />
            ) : (
                <BookingDetail
                    booking={state.content}
                    consumer={consumer}
                    onNavigate={onNavigate}
                />
            )}
        </section>
    );
}
