import {
    BOOKING_HOURS,
    BOOKING_MESSAGE_MAX,
    MAX_PARTICIPANTS,
    PAYMENT_METHODS,
    type BookingField,
    type BookingFormErrors,
    type BookingFormValues,
} from "./bookingTypes";

const REQUIRED_MESSAGES: Record<Exclude<BookingField, "mensagem">, string> = {
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
                Number.isInteger(count) &&
                count >= 1 &&
                count <= MAX_PARTICIPANTS
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

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Lê "YYYY-MM-DD" como data local; devolve null se não for uma data real. */
function parseLocalDate(value: string): Date | null {
    const match = DATE_PATTERN.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    const isReal =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
    return isReal ? date : null;
}

/** Data e horário não podem estar no passado (RN21). Usa o relógio local. */
function validateSchedule(
    values: BookingFormValues,
    now: Date,
    errors: BookingFormErrors,
): void {
    const data = values.data.trim();
    if (!data) return; // a obrigatoriedade já foi tratada

    const day = parseLocalDate(data);
    if (!day) {
        errors.data = "Informe uma data válida.";
        return;
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (day.getTime() < today.getTime()) {
        errors.data = "A data não pode estar no passado.";
        return;
    }

    if (errors.horario) return; // horário ausente ou inválido já tem erro
    const hour = Number(values.horario.split(":")[0]);
    const start = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
    );
    if (start.getTime() <= now.getTime()) {
        errors.horario = "Esse horário já passou.";
    }
}

export function validateBookingForm(
    values: BookingFormValues,
    now: Date = new Date(),
): BookingFormErrors {
    const errors: BookingFormErrors = {};
    for (const field of Object.keys(
        REQUIRED_MESSAGES,
    ) as (keyof typeof REQUIRED_MESSAGES)[]) {
        const value = values[field].trim();
        if (!value) {
            errors[field] = REQUIRED_MESSAGES[field];
            continue;
        }
        const rule = VALUE_RULES[field];
        if (rule && !rule.isValid(value)) errors[field] = rule.message;
    }
    if (values.mensagem.length > BOOKING_MESSAGE_MAX) {
        errors.mensagem = `Escreva uma mensagem de até ${BOOKING_MESSAGE_MAX} caracteres.`;
    }
    validateSchedule(values, now, errors);
    return errors;
}
