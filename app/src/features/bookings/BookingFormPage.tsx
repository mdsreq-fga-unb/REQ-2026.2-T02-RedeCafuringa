import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import type { Product } from "@/features/offers/productTypes";
import {
    BookingDateField,
    BookingSelectField,
    BookingTextAreaField,
} from "./BookingFields";
import { clearBookingDraft } from "./bookingDraft";
import { describeBookingError } from "./bookingErrors";
import {
    HOUR_OPTIONS,
    PARTICIPANT_OPTIONS,
    PAYMENT_OPTIONS,
} from "./bookingOptions";
import { buildBookingPayload } from "./bookingPayload";
import { createBooking } from "./bookingService";
import type {
    Booking,
    BookingField,
    BookingFormErrors,
    BookingFormValues,
} from "./bookingTypes";
import { validateBookingForm } from "./bookingValidation";
import "./bookings.css";

export type BookingExperience = Pick<
    Product,
    "id" | "name" | "producerName" | "local" | "duracao"
>;

type BookingFormPageProps = {
    experience: BookingExperience;
    onBack: () => void;
    onSent: (booking: Booking) => void;
};

const EMPTY_VALUES: BookingFormValues = {
    data: "",
    horario: "",
    participantes: "",
    formaPagamento: "",
    mensagem: "",
};

const FIELD_IDS: Record<BookingField, string> = {
    data: "booking-date",
    horario: "booking-time",
    participantes: "booking-participants",
    formaPagamento: "booking-payment",
};

/** Ordem da tela: o primeiro campo com erro recebe o foco. */
const FOCUS_ORDER: BookingField[] = [
    "data",
    "horario",
    "participantes",
    "formaPagamento",
];

export function BookingFormPage({
    experience,
    onBack,
    onSent,
}: BookingFormPageProps) {
    const [values, setValues] = useState<BookingFormValues>(EMPTY_VALUES);
    const [errors, setErrors] = useState<BookingFormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [focusRequest, setFocusRequest] = useState<{
        id: string;
        n: number;
    } | null>(null);

    // O foco só pode ir para o campo depois que o erro foi renderizado.
    useEffect(() => {
        if (focusRequest) document.getElementById(focusRequest.id)?.focus();
    }, [focusRequest]);

    const requestFocus = (id: string) =>
        setFocusRequest((current) => ({ id, n: (current?.n ?? 0) + 1 }));

    const setField = (field: keyof BookingFormValues, value: string) =>
        setValues((current) => ({ ...current, [field]: value }));

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitError(null);

        const validationErrors = validateBookingForm(values);
        setErrors(validationErrors);
        const firstInvalid = FOCUS_ORDER.find(
            (field) => validationErrors[field],
        );
        if (firstInvalid) {
            requestFocus(FIELD_IDS[firstInvalid]);
            return;
        }

        setSubmitting(true);
        let booking: Booking;
        try {
            booking = await createBooking(
                buildBookingPayload(experience.id, values),
            );
        } catch (error) {
            setSubmitError(describeBookingError(error));
            return;
        } finally {
            setSubmitting(false);
        }
        clearBookingDraft(experience.id);
        onSent(booking);
    };

    return (
        <section className="login-page booking-page">
            <BackButton label="Voltar" onClick={onBack} />
            <h1>Planeje seu encontro</h1>

            <div className="booking-summary">
                <p>Anfitrião: {experience.producerName}</p>
                {experience.duracao && <p>Duração: {experience.duracao}</p>}
                {experience.local && <p>Local: {experience.local}</p>}
            </div>

            <form
                className="login-form booking-form"
                noValidate
                onSubmit={handleSubmit}
            >
                <BookingDateField
                    id={FIELD_IDS.data}
                    label="Data desejada"
                    required
                    value={values.data}
                    error={errors.data}
                    onChange={(value) => setField("data", value)}
                />
                <BookingSelectField
                    id={FIELD_IDS.horario}
                    label="Horário"
                    required
                    value={values.horario}
                    options={HOUR_OPTIONS}
                    error={errors.horario}
                    onChange={(value) => setField("horario", value)}
                />
                <BookingSelectField
                    id={FIELD_IDS.participantes}
                    label="Participantes"
                    required
                    value={values.participantes}
                    options={PARTICIPANT_OPTIONS}
                    error={errors.participantes}
                    onChange={(value) => setField("participantes", value)}
                />
                <BookingSelectField
                    id={FIELD_IDS.formaPagamento}
                    label="Forma de pagamento"
                    required
                    value={values.formaPagamento}
                    options={PAYMENT_OPTIONS}
                    error={errors.formaPagamento}
                    onChange={(value) => setField("formaPagamento", value)}
                />
                <BookingTextAreaField
                    id="booking-message"
                    label="Mensagem ao produtor"
                    value={values.mensagem}
                    onChange={(value) => setField("mensagem", value)}
                />

                {submitError && (
                    <p className="form-alert booking-form-alert" role="alert">
                        {submitError}
                    </p>
                )}

                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? "Enviando…" : "Enviar pré-reserva"}
                    </ActionButton>
                </div>
            </form>
        </section>
    );
}
