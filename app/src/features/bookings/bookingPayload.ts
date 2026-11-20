import type {
    BookingFormValues,
    BookingPayload,
    PaymentMethod,
} from "./bookingTypes";

export function buildBookingPayload(
    experienceId: string,
    values: BookingFormValues,
): BookingPayload {
    const message = values.mensagem.trim();
    return {
        experienciaId: experienceId,
        data: values.data.trim(),
        horario: values.horario.trim(),
        participantes: Number(values.participantes),
        // O valor já passou por validateBookingForm, que só aceita as opções da lista.
        formaPagamento: values.formaPagamento as PaymentMethod,
        ...(message ? { mensagem: message } : {}),
    };
}