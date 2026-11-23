import { DatePicker } from "@/components/ui/DatePicker";
import { useRef, useState, type ReactNode } from "react";
import {
    HOUR_OPTIONS,
    PARTICIPANT_OPTIONS,
    type SelectOption,
} from "./bookingOptions";
import { BOOKING_MESSAGE_MAX, MAX_PARTICIPANTS } from "./bookingTypes";

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
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    const parsed = isoDate.test(value) ? new Date(`${value}T00:00:00Z`) : null;
    const selected =
        parsed &&
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
            ? parsed
            : null;
    const today = new Date();
    const minDate = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    return (
        <Field id={id} label={label} required={required} error={error}>
            <DatePicker
                id={`${id}-calendar`}
                label="Selecionar data desejada"
                selectedDate={selected}
                minDate={minDate}
                onSelect={(date) => onChange(date.toISOString().slice(0, 10))}
            >
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    className="text-input booking-date-input"
                    value={
                        isoDate.test(value)
                            ? value.split("-").reverse().join("/")
                            : value
                    }
                    maxLength={10}
                    onChange={(event) => {
                        const entered = event.target.value;
                        if (isoDate.test(entered)) {
                            onChange(entered);
                            return;
                        }
                        const digits = entered.replace(/\D/g, "").slice(0, 8);
                        onChange(
                            digits.length === 8
                                ? `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
                                : [
                                      digits.slice(0, 2),
                                      digits.slice(2, 4),
                                      digits.slice(4),
                                  ]
                                      .filter(Boolean)
                                      .join("/"),
                        );
                    }}
                    {...controlA11y(id, required, error)}
                />
            </DatePicker>
        </Field>
    );
}

export function BookingTimeField({
    id,
    label,
    required = false,
    value,
    error,
    onChange,
}: ControlProps) {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const panelId = `${id}-options`;
    const valueId = `${id}-value`;
    const selected = HOUR_OPTIONS.find((option) => option.value === value);

    function close() {
        setOpen(false);
        trigger.current?.focus();
    }

    return (
        <Field id={id} label={label} required={required} error={error}>
            <div
                className="booking-time-control"
                onKeyDown={(event) => {
                    if (open && event.key === "Escape") {
                        event.preventDefault();
                        close();
                    }
                }}
            >
                <button
                    ref={trigger}
                    id={id}
                    type="button"
                    className="booking-time-trigger"
                    value={value}
                    aria-expanded={open}
                    aria-controls={open ? panelId : undefined}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                        error ? `${valueId} ${id}-error` : valueId
                    }
                    onClick={() => setOpen(!open)}
                >
                    <span id={valueId} data-selected={Boolean(selected)}>
                        {selected?.label ?? "Escolher horário"}
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>
                {open && (
                    <div
                        className="booking-time-panel"
                        id={panelId}
                        role="group"
                        aria-label="Horários disponíveis"
                    >
                        {["Madrugada", "Manhã", "Tarde", "Noite"].map(
                            (period, index) => (
                                <div
                                    key={period}
                                    role="group"
                                    aria-label={period}
                                >
                                    <p>{period}</p>
                                    <div className="booking-time-grid">
                                        {HOUR_OPTIONS.slice(
                                            index * 6,
                                            index * 6 + 6,
                                        ).map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                aria-pressed={
                                                    value === option.value
                                                }
                                                onClick={() => {
                                                    onChange(option.value);
                                                    close();
                                                }}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
        </Field>
    );
}

export function BookingParticipantsField({
    id,
    label,
    required = false,
    value,
    error,
    onChange,
}: ControlProps) {
    const count = Number(value);
    return (
        <Field id={id} label={label} required={required} error={error}>
            <div className="booking-participants-control">
                <button
                    type="button"
                    aria-label="Diminuir participantes"
                    disabled={count <= 1}
                    onClick={() => onChange(String(count - 1))}
                >
                    −
                </button>
                <select
                    id={id}
                    className="text-input"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    {...controlA11y(id, required, error)}
                >
                    <option value="">Selecione</option>
                    {PARTICIPANT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    aria-label="Aumentar participantes"
                    disabled={count >= MAX_PARTICIPANTS}
                    onClick={() => onChange(String(count + 1))}
                >
                    +
                </button>
            </div>
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
                rows={4}
                maxLength={BOOKING_MESSAGE_MAX}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...controlA11y(id, required, error)}
                aria-describedby={
                    error ? `${id}-count ${id}-error` : `${id}-count`
                }
            />
            <p id={`${id}-count`} className="booking-message-count">
                {value.length} / {BOOKING_MESSAGE_MAX} caracteres
            </p>
        </Field>
    );
}
