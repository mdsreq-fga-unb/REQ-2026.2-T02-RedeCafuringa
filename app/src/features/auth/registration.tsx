import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import { formatCpf, isValidCpf } from "./cpf";
import { isAdultBirthDate, parseBirthDate } from "./birthDate";
import type { ConsumerSignupData } from "./registrationService";

type ConsumerProfileSelectionPageProps = {
    onNavigate: (path: string) => void;
};

type ConsumerSignupPageProps = ConsumerProfileSelectionPageProps & {
    createAccount: (data: ConsumerSignupData) => Promise<void>;
};

type SignupValues = ConsumerSignupData & {
    dataNascimento: string;
    confirmarSenha: string;
};
type SignupField = keyof SignupValues;
type SignupErrors = Partial<Record<SignupField, string>>;

const requiredFields: SignupField[] = [
    "nome",
    "cpf",
    "email",
    "dataNascimento",
    "senha",
    "confirmarSenha",
];

function formatBirthDate(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
        return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function displayBirthDate(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${date.getUTCFullYear()}`;
}

type CalendarMonth = { year: number; month: number };

function shiftCalendarMonth({ year, month }: CalendarMonth, amount: number) {
    const date = new Date(Date.UTC(year, month + amount, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function BirthDateField({
    value,
    error,
    onChange,
}: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() => {
        const selectedDate = parseBirthDate(value) ?? new Date();
        return {
            year: selectedDate.getUTCFullYear(),
            month: selectedDate.getUTCMonth(),
        };
    });
    const selectedDate = parseBirthDate(value);
    const today = new Date();
    const monthStart = new Date(
        Date.UTC(visibleMonth.year, visibleMonth.month, 1),
    );
    const daysInMonth = new Date(
        Date.UTC(visibleMonth.year, visibleMonth.month + 1, 0),
    ).getUTCDate();
    const leadingDays = (monthStart.getUTCDay() + 6) % 7;
    const monthName = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        timeZone: "UTC",
    })
        .format(monthStart)
        .replace(/^./, (character) => character.toLocaleUpperCase("pt-BR"));
    const maximumMonth = {
        year: today.getFullYear(),
        month: today.getMonth(),
    };

    const selectDay = (day: number) => {
        const date = new Date(
            Date.UTC(visibleMonth.year, visibleMonth.month, day),
        );
        onChange(displayBirthDate(date));
        setIsCalendarOpen(false);
    };

    const calendarCells = Array.from(
        { length: leadingDays + daysInMonth },
        (_, index) => {
            if (index < leadingDays) return null;
            return index - leadingDays + 1;
        },
    );

    return (
        <div className="signup-field">
            <label className="field-label" htmlFor="signup-birth-date">
                Data de nascimento <span aria-hidden="true">*</span>
            </label>
            <div className="birth-date-control">
                <input
                    id="signup-birth-date"
                    className="text-input signup-input"
                    type="text"
                    value={value}
                    aria-label="Data de nascimento"
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                        error ? "signup-birth-date-error" : undefined
                    }
                    autoComplete="bday"
                    inputMode="numeric"
                    placeholder="DD-MM-AAAA"
                    maxLength={10}
                    onChange={(event) =>
                        onChange(formatBirthDate(event.target.value))
                    }
                />
                <button
                    className="birth-calendar-trigger"
                    type="button"
                    aria-label="Abrir calendário"
                    aria-haspopup="dialog"
                    aria-expanded={isCalendarOpen}
                    aria-controls="signup-birth-calendar"
                    title="Abrir calendário"
                    onClick={() => {
                        const selected = parseBirthDate(value);
                        if (selected) {
                            setVisibleMonth({
                                year: selected.getUTCFullYear(),
                                month: selected.getUTCMonth(),
                            });
                        }
                        setIsCalendarOpen((open) => !open);
                    }}
                >
                    <CalendarIcon />
                </button>
                {isCalendarOpen && (
                    <div
                        className="birth-calendar"
                        id="signup-birth-calendar"
                        role="dialog"
                        aria-label="Selecionar data de nascimento"
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setIsCalendarOpen(false);
                            }
                        }}
                    >
                        <div className="birth-calendar-header">
                            <button
                                className="birth-calendar-nav"
                                type="button"
                                aria-label="Mês anterior"
                                onClick={() =>
                                    setVisibleMonth((month) =>
                                        shiftCalendarMonth(month, -1),
                                    )
                                }
                            >
                                <span aria-hidden="true">‹</span>
                            </button>
                            <strong>{monthName}</strong>
                            <select
                                className="birth-calendar-year"
                                aria-label="Ano"
                                value={visibleMonth.year}
                                onChange={(event) =>
                                    setVisibleMonth((month) => ({
                                        ...month,
                                        year: Number(event.target.value),
                                    }))
                                }
                            >
                                {Array.from(
                                    { length: today.getFullYear() - 1899 },
                                    (_, index) => today.getFullYear() - index,
                                ).map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="birth-calendar-nav"
                                type="button"
                                aria-label="Próximo mês"
                                disabled={
                                    visibleMonth.year === maximumMonth.year &&
                                    visibleMonth.month >= maximumMonth.month
                                }
                                onClick={() =>
                                    setVisibleMonth((month) =>
                                        shiftCalendarMonth(month, 1),
                                    )
                                }
                            >
                                <span aria-hidden="true">›</span>
                            </button>
                        </div>
                        <div
                            className="birth-calendar-weekdays"
                            aria-hidden="true"
                        >
                            {[
                                "Seg",
                                "Ter",
                                "Qua",
                                "Qui",
                                "Sex",
                                "Sáb",
                                "Dom",
                            ].map((weekday) => (
                                <span key={weekday}>{weekday}</span>
                            ))}
                        </div>
                        <div
                            className="birth-calendar-days"
                            role="group"
                            aria-label="Dias do mês"
                        >
                            {calendarCells.map((day, index) => {
                                if (day === null) {
                                    return (
                                        <span
                                            className="birth-calendar-empty"
                                            key={`empty-${index}`}
                                            aria-hidden="true"
                                        />
                                    );
                                }

                                const isFutureDate =
                                    visibleMonth.year > today.getFullYear() ||
                                    (visibleMonth.year ===
                                        today.getFullYear() &&
                                        (visibleMonth.month >
                                            today.getMonth() ||
                                            (visibleMonth.month ===
                                                today.getMonth() &&
                                                day > today.getDate())));
                                const isSelected =
                                    selectedDate?.getUTCFullYear() ===
                                        visibleMonth.year &&
                                    selectedDate.getUTCMonth() ===
                                        visibleMonth.month &&
                                    selectedDate.getUTCDate() === day;

                                return (
                                    <button
                                        className="birth-calendar-day"
                                        key={day}
                                        type="button"
                                        aria-label={`${day} de ${monthName} de ${visibleMonth.year}`}
                                        aria-pressed={isSelected}
                                        disabled={isFutureDate}
                                        onClick={() => selectDay(day)}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <p className="field-error" id="signup-birth-date-error">
                    {error}
                </p>
            )}
        </div>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="16" rx="2" />
            <path d="M7.5 3v4M16.5 3v4M3.5 9h17" />
        </svg>
    );
}

export function ConsumerProfileSelectionPage({
    onNavigate,
}: ConsumerProfileSelectionPageProps) {
    const [profile, setProfile] = useState<"consumer" | "producer" | null>(
        "consumer",
    );

    return (
        <section className="signup-page profile-selection-page">
            <BackButton label="Voltar" onClick={() => onNavigate("/perfil")} />
            <h1>Entre em sua conta</h1>
            <p className="body-copy">Escolha o tipo de perfil para começar.</p>

            <div className="profile-options" aria-label="Tipo de perfil">
                <button
                    className={`profile-option ${profile === "consumer" ? "is-selected" : ""}`}
                    type="button"
                    aria-pressed={profile === "consumer"}
                    onClick={() => setProfile("consumer")}
                >
                    <ConsumerIcon />
                    <span className="profile-option-copy">
                        <strong>Sou consumidor</strong>
                        <span>
                            Quero comprar produtos, viver experiências e apoiar
                            produtores locais.
                        </span>
                    </span>
                </button>
                <button
                    className={`profile-option ${profile === "producer" ? "is-selected" : ""}`}
                    type="button"
                    aria-pressed={profile === "producer"}
                    onClick={() => setProfile("producer")}
                >
                    <ProducerIcon />
                    <span className="profile-option-copy">
                        <strong>Sou produtor</strong>
                        <span>
                            Quero divulgar meus produtos e experiências.
                        </span>
                    </span>
                </button>
            </div>

            <div className="profile-selection-actions">
                <ActionButton
                    variant="orange"
                    disabled={profile === null}
                    onClick={() =>
                        onNavigate(
                            profile === "producer"
                                ? "/login/producer"
                                : "/login/consumer",
                        )
                    }
                >
                    Continuar
                </ActionButton>
            </div>
        </section>
    );
}

export function ConsumerSignupPage({
    createAccount,
    onNavigate,
}: ConsumerSignupPageProps) {
    const [values, setValues] = useState<SignupValues>({
        nome: "",
        cpf: "",
        email: "",
        dataNascimento: "",
        senha: "",
        confirmarSenha: "",
    });
    const [errors, setErrors] = useState<SignupErrors>({});
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const updateField = (field: SignupField, value: string) => {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
        setFormError("");
    };

    const validate = (): SignupErrors => {
        const nextErrors: SignupErrors = {};
        for (const field of requiredFields) {
            if (!values[field].trim()) nextErrors[field] = "Campo obrigatório.";
        }
        if (values.cpf && !isValidCpf(values.cpf)) {
            nextErrors.cpf = "Informe um CPF válido.";
        }
        if (
            values.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
        ) {
            nextErrors.email = "Informe um e-mail válido.";
        }
        if (values.dataNascimento) {
            if (!parseBirthDate(values.dataNascimento)) {
                nextErrors.dataNascimento =
                    "Informe uma data válida no formato DD-MM-AAAA.";
            } else if (!isAdultBirthDate(values.dataNascimento)) {
                nextErrors.dataNascimento =
                    "É necessário ter 18 anos ou mais para se cadastrar.";
            }
        }
        if (
            values.senha &&
            (values.senha.length < 8 ||
                !/[A-Za-z]/.test(values.senha) ||
                !/\d/.test(values.senha))
        ) {
            nextErrors.senha =
                "A senha precisa ter ao menos 8 caracteres, uma letra e um número.";
        }
        if (values.confirmarSenha && values.senha !== values.confirmarSenha) {
            nextErrors.confirmarSenha = "As senhas não coincidem.";
        }
        return nextErrors;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");
        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setFormError("Revise os campos indicados para continuar.");
            return;
        }

        setSubmitting(true);
        try {
            await createAccount({
                nome: values.nome.trim(),
                cpf: values.cpf,
                email: values.email.trim(),
                dataNascimento: values.dataNascimento,
                senha: values.senha,
            });
            onNavigate("/conta-criada/consumer");
        } catch (error) {
            setFormError(
                error instanceof Error && error.message
                    ? error.message
                    : "Não foi possível criar sua conta. Tente novamente.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="signup-page consumer-signup-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/escolher-perfil")}
            />
            <h1>Cadastro de consumidor</h1>
            <form className="signup-form" onSubmit={handleSubmit} noValidate>
                {formError && (
                    <p className="form-alert" role="alert">
                        {formError}
                    </p>
                )}
                <SignupFieldInput
                    id="signup-name"
                    label="Nome completo"
                    value={values.nome}
                    error={errors.nome}
                    autoComplete="name"
                    onChange={(value) => updateField("nome", value)}
                />
                <SignupFieldInput
                    id="signup-cpf"
                    label="CPF"
                    value={values.cpf}
                    error={errors.cpf}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    onChange={(value) => updateField("cpf", formatCpf(value))}
                />
                <SignupFieldInput
                    id="signup-email"
                    label="E-mail"
                    value={values.email}
                    error={errors.email}
                    type="email"
                    autoComplete="email"
                    placeholder="ana@exemplo.com"
                    onChange={(value) => updateField("email", value)}
                />
                <BirthDateField
                    value={values.dataNascimento}
                    error={errors.dataNascimento}
                    onChange={(value) => updateField("dataNascimento", value)}
                />
                <SignupFieldInput
                    id="signup-password"
                    label="Senha"
                    value={values.senha}
                    error={errors.senha}
                    type="password"
                    autoComplete="new-password"
                    onChange={(value) => updateField("senha", value)}
                />
                <SignupFieldInput
                    id="signup-confirm-password"
                    label="Confirmar senha"
                    value={values.confirmarSenha}
                    error={errors.confirmarSenha}
                    type="password"
                    autoComplete="new-password"
                    onChange={(value) => updateField("confirmarSenha", value)}
                />
                <ActionButton
                    className="signup-submit"
                    variant="orange"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? "Criando conta…" : "Criar conta"}
                </ActionButton>
            </form>
            <p className="signup-consent">
                Ao continuar, você concorda com o uso dos seus dados para
                cadastro e acesso à plataforma.
            </p>
        </section>
    );
}

export function ConsumerSignupSuccessPage({
    onNavigate,
}: ConsumerProfileSelectionPageProps) {
    return <SignupSuccessPage profile="consumer" onNavigate={onNavigate} />;
}

export function ProducerSignupSuccessPage({
    onNavigate,
}: ConsumerProfileSelectionPageProps) {
    return <SignupSuccessPage profile="producer" onNavigate={onNavigate} />;
}

function SignupSuccessPage({
    profile,
    onNavigate,
}: ConsumerProfileSelectionPageProps & {
    profile: "consumer" | "producer";
}) {
    const isConsumer = profile === "consumer";

    return (
        <section className="signup-page signup-success-page">
            <BackButton
                label="Voltar"
                onClick={() =>
                    onNavigate(
                        isConsumer ? "/cadastro/consumidor" : "/cadastro",
                    )
                }
            />
            <div className="success-check" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path d="m5 12 4.5 4.5L19 7" />
                </svg>
            </div>
            <h1>Você já faz parte da rede</h1>
            <p className="body-copy">
                Seu perfil foi criado. Use suas credenciais para acessar a
                plataforma.
            </p>
            <ActionButton
                variant="orange"
                onClick={() =>
                    onNavigate(
                        isConsumer ? "/login/consumer" : "/login/producer",
                    )
                }
            >
                Entrar na minha conta
            </ActionButton>
        </section>
    );
}

type SignupFieldInputProps = {
    id: string;
    label: string;
    value: string;
    error?: string;
    type?: string;
    autoComplete?: string;
    inputMode?: "text" | "numeric" | "email";
    placeholder?: string;
    onChange: (value: string) => void;
};

function SignupFieldInput({
    id,
    label,
    value,
    error,
    type = "text",
    autoComplete,
    inputMode,
    placeholder,
    onChange,
}: SignupFieldInputProps) {
    return (
        <div className="signup-field">
            <label className="field-label" htmlFor={id}>
                {label} <span aria-hidden="true">*</span>
            </label>
            <input
                id={id}
                className="text-input signup-input"
                type={type}
                value={value}
                aria-label={label}
                autoComplete={autoComplete}
                inputMode={inputMode}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => onChange(event.target.value)}
            />
            {error && (
                <p className="field-error" id={`${id}-error`}>
                    {error}
                </p>
            )}
        </div>
    );
}

function ConsumerIcon() {
    return (
        <svg
            className="profile-option-icon"
            viewBox="0 0 48 48"
            aria-hidden="true"
        >
            <circle cx="24" cy="14" r="8" />
            <path d="M5 42v-4c0-6 8.5-10 19-10s19 4 19 10v4H5Z" />
        </svg>
    );
}

function ProducerIcon() {
    return (
        <svg
            className="profile-option-icon"
            viewBox="0 0 48 48"
            aria-hidden="true"
        >
            <path d="M4 42h40M8 42l4-22L24 8l12 12 4 22M17 42l7-21 7 21" />
        </svg>
    );
}
