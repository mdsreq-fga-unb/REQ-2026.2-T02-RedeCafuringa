export type BookingFormValues = {
    data: string; // YYYY-MM-DD
    horario: string; // HH:MM
    participantes: string; // valor do select
    formaPagamento: string;
    mensagem: string;
};

export type BookingField =
    | "data"
    | "horario"
    | "participantes"
    | "formaPagamento";

export type BookingFormErrors = Partial<Record<BookingField, string>>;

export const MAX_PARTICIPANTS = 50;

/** Horários de hora em hora, cobrindo o dia todo: 00:00 a 23:00. */
export const BOOKING_HOURS: readonly string[] = Array.from(
    { length: 24 },
    (_, hour) => `${String(hour).padStart(2, "0")}:00`,
);

export const PAYMENT_METHODS = [
    "pix",
    "dinheiro",
    "cartao_credito",
    "cartao_debito",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];