import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import {
    bookingTotal,
    formatBookingDate,
    formatBookingTime,
    formatParticipants,
    paymentLabel,
    type BookingDetail,
} from "./bookingDetails";
import { getBooking } from "./bookingQueryService";
import { BookingSessionError } from "./bookingService";
import type { BookingStatus } from "./bookingTypes";
import "./bookings.css";

type Role = "consumer" | "producer";

type LoadBooking = (
    id: string,
    options: { signal?: AbortSignal },
) => Promise<BookingDetail | null>;

type BookingDetailPageProps = {
    id: string;
    role: Role;
    onNavigate: (path: string) => void;
    load?: LoadBooking;
};

type State =
    | { status: "loading" }
    | { status: "ready"; booking: BookingDetail }
    | { status: "missing" }
    | { status: "error" }
    | { status: "session" };

const LIST_ROUTE = "/reservas";

/** Títulos do protótipo, um por situação (CA07). */
const STATUS_TITLES: Record<BookingStatus, string> = {
    pendente: "Aguardando resposta",
    aceita: "Pré-reserva aceita",
    recusada: "Pré-reserva recusada",
    cancelada: "Pré-reserva cancelada",
};

/** Data no fuso da plataforma, para o dia não mudar com o fuso do aparelho. */
const UPDATED_AT = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

function Details({ booking, role }: { booking: BookingDetail; role: Role }) {
    const rows: Array<[string, string]> = [
        ["Local", booking.experience.local],
        ["Data", formatBookingDate(booking.date)],
        ["Horário", formatBookingTime(booking.time)],
        ["Participantes", formatParticipants(booking.participants)],
        ["Valor total", bookingTotal(booking)],
        ["Pagamento", paymentLabel(booking.paymentMethod)],
        [
            role === "producer" ? "Solicitada por" : "Responsável",
            booking.counterpart.name,
        ],
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
 * HU45: uma pré-reserva com a situação gravada agora (CA04, CA07). Quando a
 * solicitação não é de quem está vendo, só informa que não foi encontrada (CA05).
 */
export function BookingDetailPage({
    id,
    role,
    onNavigate,
    load = getBooking,
}: BookingDetailPageProps) {
    const [state, setState] = useState<State>({ status: "loading" });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        load(id, { signal: controller.signal }).then(
            (booking) => {
                if (controller.signal.aborted) return;
                setState(
                    booking
                        ? { status: "ready", booking }
                        : { status: "missing" },
                );
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
        // Busca de novo só ao abrir outra pré-reserva ou ao tentar de novo.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, attempt]);

    return (
        <section
            className="booking-page booking-detail-page"
            aria-busy={state.status === "loading"}
        >
            <BackButton label="Voltar" onClick={() => onNavigate(LIST_ROUTE)} />

            {state.status === "loading" && (
                <p role="status">Carregando pré-reserva…</p>
            )}

            {state.status === "error" && (
                <div role="alert" className="booking-list-alert">
                    <p>
                        Não foi possível carregar a pré-reserva. Verifique a
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
                        Sua sessão expirou. Entre novamente para ver a
                        pré-reserva.
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

            {state.status === "missing" && (
                <div className="booking-list-empty">
                    <h1>Pré-reserva não encontrada</h1>
                    <p>Ela não existe ou não está vinculada à sua conta.</p>
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={() => onNavigate(LIST_ROUTE)}
                    >
                        Ver minhas pré-reservas
                    </ActionButton>
                </div>
            )}

            {state.status === "ready" && (
                <>
                    <h1
                        className={`booking-status booking-status--${state.booking.status}`}
                    >
                        {STATUS_TITLES[state.booking.status]}
                    </h1>
                    <p className="booking-updated">
                        {`Última atualização: ${UPDATED_AT.format(new Date(state.booking.updatedAt))}`}
                    </p>
                    <h2>{state.booking.experience.name}</h2>
                    {!state.booking.experience.available && (
                        <p className="booking-notice">
                            Esta experiência não está mais disponível.
                        </p>
                    )}
                    <Details booking={state.booking} role={role} />
                    {state.booking.message && (
                        <section
                            className="booking-message"
                            aria-labelledby="booking-message-title"
                        >
                            <h2 id="booking-message-title">
                                {role === "producer"
                                    ? "Mensagem da consumidora"
                                    : "Sua mensagem"}
                            </h2>
                            <p>{state.booking.message}</p>
                        </section>
                    )}
                </>
            )}
        </section>
    );
}
