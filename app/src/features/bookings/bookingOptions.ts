import {
    BOOKING_HOURS,
    MAX_PARTICIPANTS,
    PAYMENT_METHODS,
    type PaymentMethod,
} from "./bookingTypes";

export type SelectOption = { value: string; label: string };

/** "09:00" vira "09h00", como no protótipo. */
export const HOUR_OPTIONS: SelectOption[] = BOOKING_HOURS.map((hour) => ({
    value: hour,
    label: hour.replace(":", "h"),
}));

export const PARTICIPANT_OPTIONS: SelectOption[] = Array.from(
    { length: MAX_PARTICIPANTS },
    (_, index) => {
        const count = index + 1;
        return {
            value: String(count),
            label: count === 1 ? "1 pessoa" : `${count} pessoas`,
        };
    },
);

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
};

/** O que a experiência informa sobre pagamento (vem de `Product`). */
export type ExperiencePayment = {
    /** Ausente nas experiências antigas: pedem sinal. */
    requiresDeposit?: boolean;
    dayPaymentMethods?: readonly PaymentMethod[];
};

/**
 * Formas que a produtora aceita, na ordem do app (mesma regra da API): as
 * cadastradas para o dia, mais o Pix quando há sinal (o sinal é pago por Pix).
 * Sem nenhuma forma cadastrada, aceita todas, para não travar a reserva.
 */
export function acceptedPaymentMethods({
    requiresDeposit = true,
    dayPaymentMethods = [],
}: ExperiencePayment): PaymentMethod[] {
    if (dayPaymentMethods.length === 0) return [...PAYMENT_METHODS];
    return PAYMENT_METHODS.filter(
        (method) =>
            dayPaymentMethods.includes(method) ||
            (requiresDeposit && method === "pix"),
    );
}

export function paymentOptionsFor(
    experience: ExperiencePayment,
): SelectOption[] {
    return acceptedPaymentMethods(experience).map((method) => ({
        value: method,
        label: PAYMENT_LABELS[method],
    }));
}
