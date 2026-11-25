import { useId, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { PixPayment } from "@/features/payments/PixPayment";
import { formatCentavos } from "@/features/payments/money";
import {
    noPixMessage,
    receiptMessage,
    receiptWhatsAppUrl,
} from "@/features/payments/receiptMessage";
import {
    formatDepositDeadline,
    type BookingPayment,
    type BookingPix,
} from "./bookingDetails";
import { BookingPaymentError } from "./bookingPaymentService";
import type { BookingStatus } from "./bookingTypes";

/** Regras que a consumidora aceita antes de ver o código Pix. */
const CANCELLATION_RULES = [
    "Cancelando até 72 horas antes, a produtora devolve o sinal.",
    "Com menos de 72 horas, o sinal não é devolvido.",
    "Se a produtora cancelar, ela devolve o sinal.",
    "O pagamento vai direto para a produtora. A Rede Cafuringa não recebe nem devolve valores.",
];

const ACTION_FAILED =
    "Não foi possível registrar agora. Verifique a conexão e tente novamente.";

type Action = () => Promise<void>;

type Props = {
    role: "consumer" | "producer";
    payment: BookingPayment;
    /** Situação da pré-reserva: cancelada, o sinal só aparece se houver devolução. */
    bookingStatus?: BookingStatus;
    onRefunded?: Action;
    pix?: BookingPix;
    experienceName?: string;
    date?: string;
    /** Telefone autorizado da produtora; ausente, a consumidora usa o contato combinado. */
    producerPhone?: string;
    onReportSent?: Action;
    onConfirm?: Action;
    onNotFound?: Action;
    onWaive?: Action;
    onReceived?: Action;
};

const deadlineOf = (payment: BookingPayment) =>
    payment.depositDeadline
        ? formatDepositDeadline(payment.depositDeadline)
        : "";

function consumerStatusText(payment: BookingPayment): string {
    switch (payment.status) {
        case "expirado":
            return `O prazo para pagar o sinal terminou em ${deadlineOf(payment)}. A vaga foi liberada.`;
        case "comprovante-enviado":
            return "Comprovante enviado. A produtora vai conferir o pagamento no banco.";
        case "sinal-confirmado":
            return "Sinal confirmado. Sua vaga está garantida.";
        case "dispensado":
            return `Esta experiência não pede sinal. Você paga ${formatCentavos(payment.totalCents)} no dia, com a produtora.`;
        case "pagamento-recebido":
            return "A produtora registrou o pagamento. Tudo certo para o dia!";
        default:
            return "";
    }
}

function producerStatusText(payment: BookingPayment): string {
    const deposit = formatCentavos(payment.depositCents);
    switch (payment.status) {
        case "aguardando-sinal":
            return `Sinal de ${deposit}: aguardando o pagamento da consumidora até ${deadlineOf(payment)}.`;
        case "comprovante-enviado":
            return `A consumidora avisou que pagou o sinal de ${deposit}.`;
        case "sinal-confirmado":
            return `Sinal de ${deposit} confirmado.`;
        case "expirado":
            return `O prazo do sinal terminou em ${deadlineOf(payment)} sem pagamento. A vaga foi liberada.`;
        case "dispensado":
            return "Vaga garantida sem sinal. O pagamento é feito no dia.";
        case "pagamento-recebido":
            return "Pagamento recebido.";
    }
}

/** Roda a ação e devolve a mensagem de erro para exibir, se houver. */
async function run(action: Action | undefined): Promise<string> {
    try {
        await action?.();
        return "";
    } catch (error) {
        return error instanceof BookingPaymentError
            ? error.message
            : ACTION_FAILED;
    }
}

function ProducerActions({
    payment,
    onConfirm,
    onNotFound,
    onWaive,
    onReceived,
}: Pick<
    Props,
    "payment" | "onConfirm" | "onNotFound" | "onWaive" | "onReceived"
>) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const reported = payment.status === "comprovante-enviado";
    // Prazo vencido: o Pix pode ter chegado atrasado, ou a vaga vai sem sinal.
    const open =
        payment.status === "aguardando-sinal" || payment.status === "expirado";
    const canConfirm = reported || open;
    const canReceive =
        payment.status === "sinal-confirmado" ||
        payment.status === "dispensado";
    const press = (action?: Action) => async () => {
        setBusy(true);
        setError(await run(action));
        setBusy(false);
    };
    return (
        <div className="booking-payment-status">
            <p>{producerStatusText(payment)}</p>
            {reported && (
                <p>Confira no extrato do seu banco antes de confirmar.</p>
            )}
            {open && (
                <p>
                    Sem sinal, a vaga fica garantida mesmo que a pessoa não
                    compareça.
                </p>
            )}
            {(canConfirm || canReceive) && (
                <div className="booking-payment-actions">
                    {canConfirm && (
                        <ActionButton
                            variant="green"
                            type="button"
                            disabled={busy}
                            onClick={press(onConfirm)}
                        >
                            Confirmar sinal
                        </ActionButton>
                    )}
                    {reported && (
                        <ActionButton
                            variant="outline"
                            type="button"
                            disabled={busy}
                            onClick={press(onNotFound)}
                        >
                            Não encontrei o pagamento
                        </ActionButton>
                    )}
                    {open && (
                        <ActionButton
                            variant="outline"
                            type="button"
                            disabled={busy}
                            onClick={press(onWaive)}
                        >
                            Confirmar sem sinal
                        </ActionButton>
                    )}
                    {canReceive && (
                        <ActionButton
                            variant="green"
                            type="button"
                            disabled={busy}
                            onClick={press(onReceived)}
                        >
                            Pagamento recebido
                        </ActionButton>
                    )}
                </div>
            )}
            {error && (
                <p className="field-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Depois de pagar: manda o comprovante à produtora e registra o aviso. */
function ReceiptSender({
    payment,
    experienceName = "",
    date = "",
    producerPhone,
    onReportSent,
}: Pick<
    Props,
    "payment" | "experienceName" | "date" | "producerPhone" | "onReportSent"
>) {
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const id = useId();

    const send = async () => {
        setError("");
        const text = receiptMessage({
            depositCents: payment.depositCents,
            experienceName,
            date,
        });
        if (file && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], text });
            } catch (cause) {
                // Fechou o menu sem enviar: nada a registrar.
                if ((cause as Error).name === "AbortError") return;
            }
        } else {
            // Abre antes de qualquer espera, para o navegador não bloquear.
            const url = receiptWhatsAppUrl(producerPhone, text);
            if (url) window.open(url, "_blank", "noopener");
        }
        setBusy(true);
        setError(await run(onReportSent));
        setBusy(false);
    };

    return (
        <div className="booking-payment-receipt">
            <h3>Já pagou?</h3>
            {!producerPhone && (
                <p>
                    Envie o comprovante para a produtora pelo contato que vocês
                    combinaram.
                </p>
            )}
            <label className="field-label" htmlFor={`${id}-receipt`}>
                Comprovante do Pix (foto ou PDF, opcional)
            </label>
            <input
                id={`${id}-receipt`}
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <ActionButton
                variant="green"
                type="button"
                disabled={busy}
                onClick={send}
            >
                Enviar comprovante e avisar a produtora
            </ActionButton>
            {error && (
                <p className="field-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Depois do cancelamento: quem deve devolver o sinal, e se já devolveu. */
function RefundStatus({
    role,
    payment,
    onRefunded,
}: Pick<Props, "role" | "payment" | "onRefunded">) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const value = formatCentavos(payment.depositCents);
    const producer = role === "producer";
    const text = {
        pendente: producer
            ? `Devolva o sinal de ${value} por Pix para a consumidora.`
            : `A produtora vai devolver o sinal de ${value} por Pix.`,
        feita: producer
            ? `Devolução do sinal de ${value} registrada.`
            : `A produtora registrou a devolução do sinal de ${value}.`,
        retido: producer
            ? `O sinal de ${value} ficou com você.`
            : `O sinal de ${value} ficou com a produtora.`,
    }[payment.refund!];
    return (
        <div className="booking-payment-status">
            <p>{text}</p>
            {producer && payment.refund === "pendente" && (
                <ActionButton
                    variant="green"
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                        setBusy(true);
                        setError(await run(onRefunded));
                        setBusy(false);
                    }}
                >
                    Sinal devolvido
                </ActionButton>
            )}
            {error && (
                <p className="field-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Quem não consegue pagar por Pix pede outra forma à produtora, pelo WhatsApp. */
function NoPixContact({
    experienceName = "",
    date = "",
    producerPhone,
}: Pick<Props, "experienceName" | "date" | "producerPhone">) {
    const url = receiptWhatsAppUrl(
        producerPhone,
        noPixMessage({ experienceName, date }),
    );
    if (!url) return null;
    return (
        <a
            className="booking-no-pix"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Não consegue pagar por Pix? Fale com a produtora (abre o WhatsApp)"
        >
            Não consegue pagar por Pix? Fale com a produtora
        </a>
    );
}

/** Pagamento por Pix da pré-reserva aceita: sinal, prazo, regras e código. */
export function BookingPaymentSection(props: Props) {
    const { role, payment, pix } = props;
    const [accepted, setAccepted] = useState(false);
    const id = useId();

    if (payment.refund) return <RefundStatus {...props} />;
    if (props.bookingStatus === "cancelada") return null;
    if (role === "producer") return <ProducerActions {...props} />;
    if (payment.status !== "aguardando-sinal")
        return (
            <p className="booking-payment-status">
                {consumerStatusText(payment)}
            </p>
        );

    return (
        <section className="booking-payment" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`}>Pague o sinal para garantir sua vaga</h2>
            <p>
                {`Pague ${formatCentavos(payment.depositCents)} (50% do total) até ${deadlineOf(payment)}. O restante, ${formatCentavos(payment.remainingCents)}, você paga no dia, com a produtora.`}
            </p>
            <h3 id={`${id}-rules`}>Regras de cancelamento</h3>
            <ul aria-labelledby={`${id}-rules`}>
                {CANCELLATION_RULES.map((rule) => (
                    <li key={rule}>{rule}</li>
                ))}
            </ul>
            <NoPixContact {...props} />
            {pix ? (
                <>
                    <label className="booking-payment-accept">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(event) =>
                                setAccepted(event.target.checked)
                            }
                        />
                        Li e aceito as regras de cancelamento
                    </label>
                    {accepted && (
                        <>
                            <PixPayment
                                chave={pix.key}
                                nome={pix.receiver}
                                cidade={pix.city}
                                valorCentavos={payment.depositCents}
                                txid={pix.txid}
                            />
                            <ReceiptSender {...props} />
                        </>
                    )}
                </>
            ) : (
                <p className="booking-notice">
                    A produtora ainda não liberou a chave Pix. Fale com ela para
                    combinar o pagamento do sinal.
                </p>
            )}
        </section>
    );
}
