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