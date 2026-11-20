import { useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import type { Product } from "@/features/offers/productTypes";
import {
    BookingDateField,
    BookingSelectField,
    BookingTextAreaField,
} from "./BookingFields";
import {
    HOUR_OPTIONS,
    PARTICIPANT_OPTIONS,
    PAYMENT_OPTIONS,
} from "./bookingOptions";
import type { BookingFormValues } from "./bookingTypes";

export type BookingExperience = Pick<
    Product,
    "id" | "name" | "producerName" | "local" | "duracao"
>;

type BookingFormPageProps = {
    experience: BookingExperience;
    onBack: () => void;
};

const EMPTY_VALUES: BookingFormValues = {
    data: "",
    horario: "",
    participantes: "",
    formaPagamento: "",
    mensagem: "",
};

export function BookingFormPage({ experience, onBack }: BookingFormPageProps) {
    const [values, setValues] = useState<BookingFormValues>(EMPTY_VALUES);

    const setField = (field: keyof BookingFormValues, value: string) =>
        setValues((current) => ({ ...current, [field]: value }));

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
                onSubmit={(event) => event.preventDefault()}
            >
                <BookingDateField
                    id="booking-date"
                    label="Data desejada"
                    required
                    value={values.data}
                    onChange={(value) => setField("data", value)}
                />
                <BookingSelectField
                    id="booking-time"
                    label="Horário"
                    required
                    value={values.horario}
                    options={HOUR_OPTIONS}
                    onChange={(value) => setField("horario", value)}
                />
                <BookingSelectField
                    id="booking-participants"
                    label="Participantes"
                    required
                    value={values.participantes}
                    options={PARTICIPANT_OPTIONS}
                    onChange={(value) => setField("participantes", value)}
                />
                <BookingSelectField
                    id="booking-payment"
                    label="Forma de pagamento"
                    required
                    value={values.formaPagamento}
                    options={PAYMENT_OPTIONS}
                    onChange={(value) => setField("formaPagamento", value)}
                />
                <BookingTextAreaField
                    id="booking-message"
                    label="Mensagem ao produtor"
                    value={values.mensagem}
                    onChange={(value) => setField("mensagem", value)}
                />

                <div className="login-actions">
                    <ActionButton variant="orange" type="submit">
                        Enviar pré-reserva
                    </ActionButton>
                </div>
            </form>
        </section>
    );
}
