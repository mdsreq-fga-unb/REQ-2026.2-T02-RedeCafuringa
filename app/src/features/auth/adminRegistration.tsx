import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import type { AdminSignupData } from "./registrationService";
import { isMockAuthEnabled } from "./authMode";

type NavigationProps = { onNavigate: (path: string) => void };

export function AdminAccessPage({ onNavigate }: NavigationProps) {
    const [selection, setSelection] = useState("login");
    return (
        <section className="signup-page profile-selection-page admin-access-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/escolher-perfil")}
            />
            <h1>Entre em sua conta</h1>
            <p className="body-copy">Escolha o tipo de perfil para começar.</p>
            <div className="profile-options" aria-label="Acesso administrativo">
                {[
                    {
                        id: "login",
                        title: "Entrar como adm",
                        copy: "Quero gerenciar os acessos e os perfis.",
                    },
                    {
                        id: "signup",
                        title: "Cadastrar adm",
                        copy: "Quero cadastrar novo usuário como admin.",
                    },
                ].map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        className="profile-option"
                        aria-label={option.title}
                        aria-pressed={selection === option.id}
                        onClick={() => setSelection(option.id)}
                    >
                        <svg
                            className="profile-option-icon"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            {option.id === "signup" ? (
                                <path d="M24 10v28M10 24h28" />
                            ) : (
                                <path d="M29 5a12 12 0 0 0-14 15L5 33a5 5 0 0 0 7 7l13-12A12 12 0 0 0 40 14l-8 8-7-7 8-9Z" />
                            )}
                        </svg>
                        <span className="profile-option-copy">
                            <strong>{option.title}</strong>
                            <span>{option.copy}</span>
                        </span>
                    </button>
                ))}
            </div>
            <div className="profile-selection-actions">
                <ActionButton
                    variant="orange"
                    onClick={() =>
                        onNavigate(
                            selection === "signup"
                                ? "/cadastro/administrador"
                                : "/admin/entrar",
                        )
                    }
                >
                    Continuar
                </ActionButton>
            </div>
        </section>
    );
}

export function AdminSignupPage({
    onNavigate,
    createAccount,
}: NavigationProps & {
    createAccount: (data: AdminSignupData) => Promise<void>;
}) {
    const [values, setValues] = useState({
        email: "",
        senha: "",
        confirmarSenha: "",
    });
    const [errors, setErrors] = useState<
        Partial<Record<keyof typeof values, string>>
    >({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const pending = useRef(false);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending.current) return;
        const next: typeof errors = {};
        for (const field of Object.keys(values) as (keyof typeof values)[]) {
            if (!values[field].trim()) next[field] = "Campo obrigatório.";
        }
        if (
            values.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
        )
            next.email = "Informe um e-mail válido.";
        if (
            values.senha.trim() &&
            (values.senha.length < 8 ||
                !/[A-Za-z]/.test(values.senha) ||
                !/\d/.test(values.senha))
        )
            next.senha =
                "A senha precisa ter ao menos 8 caracteres, uma letra e um número.";
        if (values.confirmarSenha && values.senha !== values.confirmarSenha)
            next.confirmarSenha = "As senhas não coincidem.";
        setErrors(next);
        if (Object.keys(next).length) {
            setMessage("Revise os campos indicados.");
            document.getElementById(`admin-${Object.keys(next)[0]}`)?.focus();
            return;
        }
        setMessage("");
        pending.current = true;
        setLoading(true);
        try {
            await createAccount({ email: values.email, senha: values.senha });
            onNavigate("/conta-criada/admin");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Não foi possível cadastrar. Tente novamente.",
            );
        } finally {
            pending.current = false;
            setLoading(false);
        }
    };
    return (
        <section className="signup-page admin-signup-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/admin/acesso")}
            />
            <h1>Cadastro de administrador</h1>
            <p className="admin-warning">
                Atenção! Ao cadastrar um novo usuário como administrador, ele
                terá acesso a todas as funcionalidades de um admin.
            </p>
            <form onSubmit={submit} noValidate aria-busy={loading}>
                {message && (
                    <p className="form-alert" role="alert">
                        {message}
                    </p>
                )}
                {(
                    [
                        ["email", "E-mail", "email"],
                        ["senha", "Senha", "password"],
                        ["confirmarSenha", "Confirmar senha", "password"],
                    ] as const
                ).map(([field, label, type]) => (
                    <div className="signup-field" key={field}>
                        <label
                            className="field-label"
                            htmlFor={`admin-${field}`}
                        >
                            {label} <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id={`admin-${field}`}
                            aria-label={label}
                            className="text-input signup-input"
                            type={type}
                            required
                            autoComplete={
                                field === "email" ? "email" : "new-password"
                            }
                            placeholder={
                                field === "email"
                                    ? "ana@exemplo.com"
                                    : "••••••••"
                            }
                            value={values[field]}
                            readOnly={loading}
                            aria-invalid={Boolean(errors[field])}
                            aria-describedby={
                                errors[field]
                                    ? `admin-${field}-error`
                                    : undefined
                            }
                            onChange={(event) =>
                                setValues({
                                    ...values,
                                    [field]: event.target.value,
                                })
                            }
                        />
                        {errors[field] && (
                            <p
                                className="field-error"
                                id={`admin-${field}-error`}
                            >
                                {errors[field]}
                            </p>
                        )}
                    </div>
                ))}
                <ActionButton
                    className="signup-submit"
                    variant="orange"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Cadastrando…" : "Entrar"}
                </ActionButton>
            </form>
        </section>
    );
}

export function AdminSignupSuccessPage({ onNavigate }: NavigationProps) {
    return (
        <section className="signup-page signup-success-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/admin/acesso")}
            />
            <div className="success-check" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path d="m5 12 4.5 4.5L19 7" />
                </svg>
            </div>
            <h1>Usuário admin cadastrado com sucesso!</h1>
            <p className="body-copy">
                O novo usuário foi cadastrado como administrador e já poderá
                entrar com suas credenciais.
            </p>
            <ActionButton
                variant="orange"
                onClick={() => onNavigate("/admin/entrar")}
            >
                Entrar
            </ActionButton>
        </section>
    );
}

/** O contrato atual autentica por CPF; login administrativo por e-mail depende do backend. */
export function AdminLoginPage({ onNavigate }: NavigationProps) {
    const [entered, setEntered] = useState(false);
    if (isMockAuthEnabled) {
        return (
            <section className="signup-page admin-signup-page">
                <BackButton
                    label="Voltar"
                    onClick={() => onNavigate("/admin/acesso")}
                />
                <h1>
                    {entered
                        ? "Acesso administrativo local"
                        : "Entrar como administrador"}
                </h1>
                {entered ? (
                    <>
                        <p className="body-copy" role="status">
                            Entrada simulada com sucesso. Use o menu “Explorar
                            telas” para navegar pelas telas existentes.
                        </p>
                        <ActionButton
                            variant="orange"
                            onClick={() =>
                                onNavigate("/cadastro/administrador")
                            }
                        >
                            Cadastrar adm
                        </ActionButton>
                    </>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            setEntered(true);
                        }}
                    >
                        <p className="demo-note">
                            Demonstração: use qualquer e-mail válido e uma senha
                            com pelo menos 8 caracteres. Nenhuma permissão real
                            é concedida.
                        </p>
                        <label
                            className="field-label"
                            htmlFor="demo-admin-email"
                        >
                            E-mail
                        </label>
                        <input
                            className="text-input signup-input"
                            id="demo-admin-email"
                            type="email"
                            autoComplete="username"
                            defaultValue="admin@exemplo.com"
                            required
                        />
                        <label
                            className="field-label"
                            htmlFor="demo-admin-password"
                        >
                            Senha
                        </label>
                        <input
                            className="text-input signup-input"
                            id="demo-admin-password"
                            type="password"
                            autoComplete="current-password"
                            defaultValue="senha123"
                            minLength={8}
                            required
                        />
                        <ActionButton
                            variant="orange"
                            className="signup-submit"
                            type="submit"
                        >
                            Entrar
                        </ActionButton>
                    </form>
                )}
            </section>
        );
    }
    return (
        <section className="signup-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/admin/acesso")}
            />
            <h1>Entrar como administrador</h1>
            <p className="body-copy" role="status">
                O acesso administrativo por e-mail estará disponível após a
                integração com o serviço de autenticação.
            </p>
        </section>
    );
}
