export type BookingFormValues = {
    data: string; // YYYY-MM-DD
    horario: string; // HH:MM
    participantes: string; // valor do select
    formaPagamento: string;
    mensagem: string;
};

export type BookingField =
    "data" | "horario" | "participantes" | "formaPagamento" | "mensagem";

export type BookingFormErrors = Partial<Record<BookingField, string>>;

export const BOOKING_MESSAGE_MAX = 500;

export const MAX_PARTICIPANTS = 50;

/** Horários de hora em hora, cobrindo o dia todo: 00:00 a 23:00. */
export const BOOKING_HOURS: readonly string[] = Array.from(
    { length: 24 },
    (_, hour) => `${String(hour).padStart(2, "0")}:00`,
);

export const BOOKING_STATUSES: readonly BookingStatus[] = [
    "pendente",
    "aceita",
    "recusada",
    "cancelada",
];

export const PAYMENT_METHODS = [
    "pix",
    "dinheiro",
    "cartao_credito",
    "cartao_debito",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type BookingStatus = "pendente" | "aceita" | "recusada" | "cancelada";

/** Corpo do POST /bookings (contrato definido pelo front, a alinhar com o backend). */
export type BookingPayload = {
    experienciaId: string;
    data: string;
    horario: string;
    participantes: number;
    formaPagamento: PaymentMethod;
    mensagem?: string;
};

/** Resposta 201 do POST /bookings. */
export type BookingResponse = {
    id: string;
    experienciaId: string;
    data: string;
    horario: string;
    participantes: number;
    formaPagamento: PaymentMethod;
    mensagem?: string;
    status: BookingStatus;
    criadoEm: string;
};

/** Pré-reserva como o front usa. */
export type Booking = {
    id: string;
    experienceId: string;
    date: string;
    time: string;
    participants: number;
    paymentMethod: PaymentMethod;
    message?: string;
    status: BookingStatus;
    createdAt: string;
};
