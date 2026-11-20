import {
    BOOKING_HOURS,
    MAX_PARTICIPANTS,
    PAYMENT_METHODS,
    type BookingField,
    type BookingFormErrors,
    type BookingFormValues,
} from "./bookingTypes";

const REQUIRED_MESSAGES: Record<BookingField, string> = {
    data: "Informe a data desejada.",
    horario: "Escolha o horário.",
    participantes: "Informe o número de participantes.",
    formaPagamento: "Escolha a forma de pagamento.",
};

type Rule = { isValid: (value: string) => boolean; message: string };

const VALUE_RULES: Partial<Record<BookingField, Rule>> = {
    horario: {
        isValid: (value) => BOOKING_HOURS.includes(value),
        message: "Escolha um horário da lista.",
    },
    participantes: {
        isValid: (value) => {
            const count = Number(value);
            return (
                Number.isInteger(count) && count >= 1 && count <= MAX_PARTICIPANTS
            );
        },
        message: `Informe de 1 a ${MAX_PARTICIPANTS} participantes.`,
    },
    formaPagamento: {
        isValid: (value) =>
            (PAYMENT_METHODS as readonly string[]).includes(value),
        message: "Escolha uma forma de pagamento da lista.",
    },
};

export function validateBookingForm(
    values: BookingFormValues,
): BookingFormErrors {
    const errors: BookingFormErrors = {};
    for (const field of Object.keys(REQUIRED_MESSAGES) as BookingField[]) {
        const value = values[field].trim();
        if (!value) {
            errors[field] = REQUIRED_MESSAGES[field];
            continue;
        }
        const rule = VALUE_RULES[field];
        if (rule && !rule.isValid(value)) errors[field] = rule.message;
    }
    return errors;
}