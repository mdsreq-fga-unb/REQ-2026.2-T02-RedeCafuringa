import type { ReactNode } from "react";
import type { SelectOption } from "./bookingOptions";

type FieldProps = {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
};

function Field({ id, label, required = false, error, children }: FieldProps) {
    return (
        <div className="booking-field" data-field={id}>
            <label
                className={`field-label ${required ? "field-label-required" : ""}`}
                htmlFor={id}
            >
                {label}
            </label>
            {children}
            {error && (
                <p id={`${id}-error`} className="field-error">
                    {error}
                </p>
            )}
        </div>
    );
}

function controlA11y(id: string, required: boolean, error?: string) {
    return {
        "aria-required": required,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
    };
}

type ControlProps = {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    error?: string;
    onChange: (value: string) => void;
};

export function BookingDateField({
    id,
    label,
    required = false,
    value,
    error,
    onChange,
}: ControlProps) {
    return (
        <Field id={id} label={label} required={required} error={error}>
            <input
                id={id}
                type="date"
                className="text-input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...controlA11y(id, required, error)}
            />
        </Field>
    );
}

export function BookingSelectField({
    id,
    label,
    required = false,
    value,
    error,
    options,
    onChange,
}: ControlProps & { options: SelectOption[] }) {
    return (
        <Field id={id} label={label} required={required} error={error}>
            <select
                id={id}
                className="text-input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...controlA11y(id, required, error)}
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
    error,
    onChange,
}: ControlProps) {
    return (
        <Field id={id} label={label} required={required} error={error}>
            <textarea
                id={id}
                className="text-input"
                rows={3}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...controlA11y(id, required, error)}
            />
        </Field>
    );
}
