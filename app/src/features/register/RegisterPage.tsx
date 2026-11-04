import { useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { formatCpf } from "@/features/auth/cpf";
import { BirthDateField } from "@/features/auth/registration";
import { BackButton } from "../../components/navigation/BackButton";
import { ActionButton } from "../../components/ui/ActionButton";
import { buildRegisterPayload, validateRegisterForm } from "./registerForm";
import { registerProducer } from "./registerService";
import type { RegisterResult } from "./registerService";
import type {
    DocumentType,
    RegisterFormErrors,
    RegisterFormValues,
} from "./registerForm";
import { formatCnpj, formatPhone } from "./validators";

type RegisterPageProps = {
    onNavigate: (path: string) => void;
};

const INITIAL_VALUES: RegisterFormValues = {
    documentType: "cpf",
    birthDate: "",
    name: "",
    document: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
};

type TextFieldProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange"
> & {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    error?: string;
    onChange: (value: string) => void;
};

function TextField({
    id,
    label,
    required = false,
    value,
    error,
    onChange,
    ...inputProps
}: TextFieldProps) {
    return (
        <div className="register-field" data-field={id}>
            <label
                className={`field-label ${required ? "field-label-required" : ""}`}
                htmlFor={id}
            >
                {label}
            </label>
            <input
                {...inputProps}
                id={id}
                className="text-input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label={label}
                aria-required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
                <p id={`${id}-error`} className="field-error">
                    {error}
                </p>
            )}
        </div>
    );
}

type SelectFieldProps = {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    options: string[];
    onChange: (value: string) => void;
};

function SelectField({
    id,
    label,
    required = false,
    value,
    options,
    onChange,
}: SelectFieldProps) {
    return (
        <div className="register-field" data-field={id}>
            <label
                className={`field-label ${required ? "field-label-required" : ""}`}
                htmlFor={id}
            >
                {label}
            </label>
            <select
                id={id}
                className="text-input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label={label}
                aria-required={required}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

type RegisterFailure = Extract<RegisterResult, { ok: false }>;

function rateLimitMessage(seconds?: number) {
    if (seconds === undefined)
        return "Muitas tentativas. Tente novamente em instantes.";
    return `Muitas tentativas. Tente novamente em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`;
}

function FailureAlert({
    failure,
    onGoToLogin,
}: {
    failure: RegisterFailure;
    onGoToLogin: () => void;
}) {
    switch (failure.reason) {
        case "duplicate":
            return (
                <>
                    <p className="form-alert" role="alert">
                        CPF/CNPJ ou e-mail já cadastrado. Entre na sua conta ou
                        recupere o acesso.
                    </p>
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={onGoToLogin}
                    >
                        Ir para o login
                    </ActionButton>
                </>
            );
        case "invalid":
            return (
                <div className="form-alert" role="alert">
                    <p>Confira os dados informados:</p>
                    <ul>
                        {failure.messages.map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                </div>
            );
        case "rate_limit":
            return (
                <p className="form-alert" role="alert">
                    {rateLimitMessage(failure.retryAfterSeconds)}
                </p>
            );
        case "error":
            return (
                <p className="form-alert" role="alert">
                    Não foi possível concluir o cadastro agora. Tente novamente
                    em instantes.
                </p>
            );
    }
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
    const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
    const [errors, setErrors] = useState<RegisterFormErrors>({});
    const [loading, setLoading] = useState(false);
    const [failure, setFailure] = useState<RegisterFailure | null>(null);
    const [referenceDetails, setReferenceDetails] = useState({
        responsible: "",
        category: "Produtos",
        paymentMethods: "Pix, Cartão de crédito",
    });

    const isCnpj = values.documentType === "cnpj";
    const formatDocument = isCnpj ? formatCnpj : formatCpf;

    const setField = <K extends keyof RegisterFormValues>(
        field: K,
        value: RegisterFormValues[K],
    ) => setValues((current) => ({ ...current, [field]: value }));

    const changeDocumentType = (type: DocumentType) => {
        setValues((current) => ({
            ...current,
            documentType: type,
            document: "",
            birthDate: "",
        }));
        setErrors({});
        setFailure(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFailure(null);

        const validationErrors = validateRegisterForm(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        let result: RegisterResult;
        try {
            result = await registerProducer(buildRegisterPayload(values));
        } catch {
            result = { ok: false, reason: "error" };
        }

        if (result.ok) {
            onNavigate("/conta-criada/producer");
            return;
        }

        setFailure(result);
        setLoading(false);
    };

    return (
        <section className="login-page register-page">
            <BackButton label="Voltar" onClick={() => onNavigate("/entrar")} />
            <h1>Cadastro de produtor</h1>

            <form
                className="login-form register-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {failure && (
                    <div className="register-form-alert">
                        <FailureAlert
                            failure={failure}
                            onGoToLogin={() => onNavigate("/entrar")}
                        />
                    </div>
                )}

                <TextField
                    id="register-name"
                    label="Nome da iniciativa"
                    required
                    type="text"
                    autoComplete="name"
                    placeholder="Sítio Raízes"
                    value={values.name}
                    error={errors.name}
                    onChange={(value) => setField("name", value)}
                />

                <TextField
                    id="register-responsible"
                    label="Responsável"
                    required
                    type="text"
                    autoComplete="name"
                    placeholder="Maria Silva"
                    value={referenceDetails.responsible}
                    onChange={(value) =>
                        setReferenceDetails((current) => ({
                            ...current,
                            responsible: value,
                        }))
                    }
                />

                <fieldset className="choice-group register-document-type">
                    <legend className="field-label">Tipo de documento</legend>
                    <label className="choice-option">
                        <input
                            type="radio"
                            name="documentType"
                            value="cpf"
                            checked={!isCnpj}
                            onChange={() => changeDocumentType("cpf")}
                        />
                        Pessoa física (CPF)
                    </label>
                    <label className="choice-option">
                        <input
                            type="radio"
                            name="documentType"
                            value="cnpj"
                            checked={isCnpj}
                            onChange={() => changeDocumentType("cnpj")}
                        />
                        Pessoa jurídica (CNPJ)
                    </label>
                </fieldset>

                <TextField
                    id="register-document"
                    label={isCnpj ? "CNPJ (empresa / MEI)" : "CPF"}
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder={
                        isCnpj ? "00.000.000/0001-00" : "000.000.000-00"
                    }
                    value={values.document}
                    error={errors.document}
                    onChange={(value) =>
                        setField("document", formatDocument(value))
                    }
                />

                {!isCnpj && (
                    <BirthDateField
                        value={values.birthDate}
                        error={errors.birthDate}
                        onChange={(value) => {
                            setField("birthDate", value);
                        }}
                    />
                )}

                <SelectField
                    id="register-category"
                    label="Categoria"
                    required
                    value={referenceDetails.category}
                    options={[
                        "Produtos",
                        "Experiências",
                        "Produtos e experiências",
                    ]}
                    onChange={(value) =>
                        setReferenceDetails((current) => ({
                            ...current,
                            category: value,
                        }))
                    }
                />

                <TextField
                    id="register-address"
                    label="Localidade"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Cafuringa, Brasília, DF"
                    value={values.address}
                    error={errors.address}
                    onChange={(value) => setField("address", value)}
                />

                <SelectField
                    id="register-payment-methods"
                    label="Formas de pagamento"
                    required
                    value={referenceDetails.paymentMethods}
                    options={[
                        "Pix",
                        "Pix, Cartão de crédito",
                        "Pix, Dinheiro",
                        "Pix, Cartão de crédito, Dinheiro",
                    ]}
                    onChange={(value) =>
                        setReferenceDetails((current) => ({
                            ...current,
                            paymentMethods: value,
                        }))
                    }
                />

                <TextField
                    id="register-phone"
                    label="Telefone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    value={values.phone}
                    error={errors.phone}
                    onChange={(value) => setField("phone", formatPhone(value))}
                />

                <TextField
                    id="register-email"
                    label="E-mail"
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="raizes@exemplo.com"
                    value={values.email}
                    error={errors.email}
                    onChange={(value) => setField("email", value)}
                />

                <TextField
                    id="register-password"
                    label="Senha"
                    required
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={values.password}
                    error={errors.password}
                    onChange={(value) => setField("password", value)}
                />

                <TextField
                    id="register-confirm-password"
                    label="Confirmar senha"
                    required
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    error={errors.confirmPassword}
                    onChange={(value) => setField("confirmPassword", value)}
                />

                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Continuando…" : "Continuar"}
                    </ActionButton>
                </div>
            </form>
        </section>
    );
}
