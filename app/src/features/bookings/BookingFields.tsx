import type { ReactNode } from "react";
import type { SelectOption } from "./bookingOptions";

type FieldProps = {
    id: string;
    label: string;
    required?: boolean;
    children: ReactNode;
};

function Field({ id, label, required = false, children }: FieldProps) {
    return (
        <div className="booking-field" data-field={id}>
            <label
                className={`field-label ${required ? "field-label-required" : ""}`}
                htmlFor={id}
            >
                {label}
            </label>
            {children}
        </div>
    );
}

type ControlProps = {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
};

export function BookingDateField({
    id,
    label,
    required = false,
    value,
    onChange,
}: ControlProps) {
    return (
        <Field id={id} label={label} required={required}>
            <input
                id={id}
                type="date"
                className="text-input"
                value={value}
                aria-required={required}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

export function BookingSelectField({
    id,
    label,
    required = false,
    value,
    options,
    onChange,
}: ControlProps & { options: SelectOption[] }) {
    return (
        <Field id={id} label={label} required={required}>
            <select
                id={id}
                className="text-input"
                value={value}
                aria-required={required}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">Selecione</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

export function BookingTextAreaField({
    id,
    label,
    required = false,
    value,
    onChange,
}: ControlProps) {
    return (
        <Field id={id} label={label} required={required}>
            <textarea
                id={id}
                className="text-input"
                rows={3}
                value={value}
                aria-required={required}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}
