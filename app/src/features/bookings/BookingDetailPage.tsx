import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import {
    bookingCode,
    bookingTotal,
    formatBookingDate,
    formatBookingTime,
    formatParticipants,
    paymentLabel,
    type BookingDetail,
    type BookingPayment,
} from "./bookingDetails";
import {
    bookingConsultationLoginRoute,
    bookingRoute,
    experienceDetailsRoute,
    RECEIVED_BOOKINGS_ROUTE,
} from "./bookingRoutes";
import { getPublicTrajectory } from "@/features/trajectory/trajectoryService";
import { BookingPaymentSection } from "./BookingPaymentSection";
import {
    confirmDeposit as confirm,
    reportDepositNotFound as reportNotFound,
    reportDepositRefunded as reportRefunded,
    reportDepositSent as reportSent,
} from "./bookingPaymentService";
import { cancelBookingByProducer } from "./bookingCancelService";
import { ProducerCancel } from "./ProducerCancel";
import { markBookingUpdateRead } from "./bookingNotificationsService";
import { getBooking } from "./bookingQueryService";
import { BookingSessionError } from "./bookingService";
import type { BookingStatus } from "./bookingTypes";
import "./bookings.css";

type Role = "consumer" | "producer";

type LoadBooking = (
    id: string,
    options: { signal?: AbortSignal },
) => Promise<BookingDetail | null>;

type PaymentAction = (id: string) => Promise<BookingPayment>;

type BookingDetailPageProps = {
    id: string;
    role: Role;
    fromNotifications?: boolean;
    onNavigate: (path: string) => void;
    load?: LoadBooking;
    /** Telefone autorizado da produtora, para mandar o comprovante (HU39). */
    loadProducerPhone?: (producerId: string) => Promise<string | undefined>;
    reportDepositSent?: PaymentAction;
    confirmDeposit?: PaymentAction;
    reportDepositNotFound?: PaymentAction;
    reportDepositRefunded?: PaymentAction;
    /** A produtora cancela a pré-reserva aceita (RN20 revista). */
    cancelAsProducer?: (id: string) => Promise<unknown>;
};

/** O perfil público só traz o telefone para quem está logado e se ela autorizou. */
const producerPhone = (producerId: string) =>
    getPublicTrajectory(producerId).then(
        (profile) => profile.telefone,
        () => undefined,
    );

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
        ["Data", formatBookingDate(booking.date)],
        ["Horário", formatBookingTime(booking.time)],
        ["Participantes", formatParticipants(booking.participants)],
        ["Valor total", bookingTotal(booking)],
        ["Pagamento", paymentLabel(booking.paymentMethod)],
        ["Local", booking.experience.local],
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
    fromNotifications = false,
    onNavigate,
    load = getBooking,
    loadProducerPhone = producerPhone,
    reportDepositSent = reportSent,
    confirmDeposit = confirm,
    reportDepositNotFound = reportNotFound,
    reportDepositRefunded = reportRefunded,
    cancelAsProducer = cancelBookingByProducer,
}: BookingDetailPageProps) {
    const backRoute = fromNotifications ? RECEIVED_BOOKINGS_ROUTE : LIST_ROUTE;
    const [state, setState] = useState<State>({ status: "loading" });
    const [attempt, setAttempt] = useState(0);
    const [phone, setPhone] = useState<string>();
    const consumerOwesDeposit =
        role === "consumer" &&
        state.status === "ready" &&
        state.booking.payment?.status === "aguardando-sinal" &&
        Boolean(state.booking.pix);
    const producerId =
        state.status === "ready" ? state.booking.counterpart.id : "";

    useEffect(() => {
        if (!consumerOwesDeposit || !producerId) return;
        let active = true;
        void loadProducerPhone(producerId).then((value) => {
            if (active) setPhone(value);
        });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consumerOwesDeposit, producerId]);

    /** Ação no sinal: a tela passa a mostrar o pagamento que a API devolveu. */
    const paymentAction = (action: PaymentAction) => async () => {
        const payment = await action(id);
        setState((current) =>
            current.status === "ready"
                ? {
                      status: "ready",
                      booking: {
                          ...current.booking,
                          payment,
                          ...(payment.status === "aguardando-sinal"
                              ? {}
                              : { pix: undefined }),
                      },
                  }
                : current,
        );
    };

    useEffect(() => {
        const controller = new AbortController();
        load(id, { signal: controller.signal }).then(
            (booking) => {
                if (controller.signal.aborted) return;
                // Ver o detalhe, por qualquer caminho, é ler a atualização.
                if (booking && booking.status !== "pendente") {
                    markBookingUpdateRead(`${booking.id}:${booking.status}`);
                }
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
            <BackButton label="Voltar" onClick={() => onNavigate(backRoute)} />

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
                        onClick={() =>
                            onNavigate(
                                fromNotifications
                                    ? bookingConsultationLoginRoute(
                                          id,
                                          role === "producer",
                                      )
                                    : `/login/${role}`,
                            )
                        }
                    >
                        Entrar
                    </ActionButton>
                </div>
            )}

            {state.status === "missing" && (
                <div className="booking-list-empty" role="alert">
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
                <div className="booking-detail-content">
                    <header
                        className="booking-detail-header"
                        data-status={state.booking.status}
                    >
                        <h1
                            className={`booking-status booking-status--${state.booking.status}`}
                        >
                            {STATUS_TITLES[state.booking.status]}
                        </h1>
                        <div className="booking-detail-meta">
                            <strong>{bookingCode(state.booking.id)}</strong>
                            <p className="booking-updated">
                                {`Última atualização: ${UPDATED_AT.format(new Date(state.booking.updatedAt))}`}
                            </p>
                        </div>
                    </header>
                    <section
                        className="booking-detail-summary"
                        aria-labelledby="booking-experience-title"
                    >
                        <h2 id="booking-experience-title">
                            {state.booking.experience.name}
                        </h2>
                        {!state.booking.experience.available && (
                            <p className="booking-notice">
                                Esta experiência não está mais disponível.
                            </p>
                        )}
                        <Details booking={state.booking} role={role} />
                    </section>
                    {state.booking.payment && (
                        <BookingPaymentSection
                            role={role}
                            payment={state.booking.payment}
                            pix={state.booking.pix}
                            experienceName={state.booking.experience.name}
                            date={state.booking.date}
                            producerPhone={phone}
                            onReportSent={paymentAction(reportDepositSent)}
                            onConfirm={paymentAction(confirmDeposit)}
                            onNotFound={paymentAction(reportDepositNotFound)}
                            onRefunded={paymentAction(reportDepositRefunded)}
                            bookingStatus={state.booking.status}
                        />
                    )}
                    {state.booking.responseMessage && (
                        <section
                            className="booking-message booking-message--response"
                            aria-labelledby="booking-response-title"
                        >
                            <h2 id="booking-response-title">
                                {role === "consumer"
                                    ? "Mensagem do produtor"
                                    : "Sua resposta"}
                            </h2>
                            <p>{state.booking.responseMessage}</p>
                        </section>
                    )}
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
                    {role === "consumer" &&
                        state.booking.experience.available &&
                        state.booking.status === "aceita" && (
                            <ActionButton
                                variant="outline"
                                type="button"
                                onClick={() =>
                                    onNavigate(
                                        experienceDetailsRoute(
                                            state.booking.experienceId,
                                        ),
                                    )
                                }
                            >
                                Ver experiência e contato
                            </ActionButton>
                        )}
                    {role === "consumer" &&
                        state.booking.experience.available &&
                        state.booking.status === "recusada" && (
                            <ActionButton
                                variant="orange"
                                type="button"
                                onClick={() =>
                                    onNavigate(
                                        bookingRoute(
                                            state.booking.experienceId,
                                        ),
                                    )
                                }
                            >
                                Fazer nova pré-reserva
                            </ActionButton>
                        )}
                    {/* HU46 CA02 e RN20 revista: a solicitante cancela a pendente ou a aceita. */}
                    {role === "consumer" &&
                        (state.booking.status === "pendente" ||
                            state.booking.status === "aceita") && (
                            <button
                                type="button"
                                className="button booking-cancel-button"
                                onClick={() =>
                                    onNavigate(
                                        `/reservas/${encodeURIComponent(state.booking.id)}/cancelar`,
                                    )
                                }
                            >
                                Cancelar solicitação
                            </button>
                        )}
                    {role === "producer" &&
                        state.booking.status === "aceita" && (
                            <ProducerCancel
                                booking={state.booking}
                                cancel={() => cancelAsProducer(id)}
                                onCancelled={() => setAttempt((n) => n + 1)}
                            />
                        )}
                </div>
            )}
        </section>
    );
}
