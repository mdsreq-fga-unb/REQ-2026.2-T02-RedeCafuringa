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

export const PAYMENT_OPTIONS: SelectOption[] = PAYMENT_METHODS.map(
    (method) => ({ value: method, label: PAYMENT_LABELS[method] }),
);
