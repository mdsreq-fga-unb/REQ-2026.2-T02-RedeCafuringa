import type {
    BookingField,
    BookingFormErrors,
    BookingFormValues,
} from "./bookingTypes";

const REQUIRED_MESSAGES: Record<BookingField, string> = {
    data: "Informe a data desejada.",
    horario: "Escolha o horário.",
    participantes: "Informe o número de participantes.",
    formaPagamento: "Escolha a forma de pagamento.",
};

export function validateBookingForm(
    values: BookingFormValues,
): BookingFormErrors {
    const errors: BookingFormErrors = {};
    for (const field of Object.keys(REQUIRED_MESSAGES) as BookingField[]) {
        if (!values[field].trim()) errors[field] = REQUIRED_MESSAGES[field];
    }
    return errors;
}