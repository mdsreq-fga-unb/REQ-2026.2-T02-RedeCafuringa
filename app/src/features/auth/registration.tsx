import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import { formatCpf, isValidCpf } from "./cpf";
import type { ConsumerSignupData } from "./registrationService";

type ConsumerProfileSelectionPageProps = {
    onNavigate: (path: string) => void;
};

type ConsumerSignupPageProps = ConsumerProfileSelectionPageProps & {
    createAccount: (data: ConsumerSignupData) => Promise<void>;
};

type SignupValues = ConsumerSignupData & { confirmarSenha: string };
type SignupField = keyof SignupValues;
type SignupErrors = Partial<Record<SignupField, string>>;

const requiredFields: SignupField[] = [
    "nome",
    "cpf",
    "email",
    "senha",
    "confirmarSenha",
];

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
    return (
        <section className="signup-page signup-success-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/cadastro/consumidor")}
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
                onClick={() => onNavigate("/login/consumer")}
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
