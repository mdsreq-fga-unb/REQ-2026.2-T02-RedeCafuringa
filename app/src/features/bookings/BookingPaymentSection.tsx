import { useId, useState } from "react";
import { PixPayment } from "@/features/payments/PixPayment";
import { formatCentavos } from "@/features/payments/money";
import {
    formatDepositDeadline,
    type BookingPayment,
    type BookingPix,
} from "./bookingDetails";

/** Regras que a consumidora aceita antes de ver o código Pix. */
const CANCELLATION_RULES = [
    "Cancelando até 72 horas antes, a produtora devolve o sinal.",
    "Com menos de 72 horas, o sinal não é devolvido.",
    "Se a produtora cancelar, ela devolve o sinal.",
    "O pagamento vai direto para a produtora. A Rede Cafuringa não recebe nem devolve valores.",
];

type Props = {
    role: "consumer" | "producer";
    payment: BookingPayment;
    pix?: BookingPix;
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
            return `A consumidora avisou que pagou o sinal de ${deposit}. Confira no extrato do seu banco.`;
        case "sinal-confirmado":
            return `Sinal de ${deposit} confirmado.`;
        case "expirado":
            return `O prazo do sinal terminou em ${deadlineOf(payment)} sem pagamento. A vaga foi liberada.`;
        case "dispensado":
            return "Esta experiência não pede sinal.";
    }
}

/** Pagamento por Pix da pré-reserva aceita: sinal, prazo, regras e código. */
export function BookingPaymentSection({ role, payment, pix }: Props) {
    const [accepted, setAccepted] = useState(false);
    const id = useId();

    if (role === "producer")
        return (
            <p className="booking-payment-status">
                {producerStatusText(payment)}
            </p>
        );
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
                        <PixPayment
                            chave={pix.key}
                            nome={pix.receiver}
                            cidade={pix.city}
                            valorCentavos={payment.depositCents}
                            txid={pix.txid}
                        />
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
