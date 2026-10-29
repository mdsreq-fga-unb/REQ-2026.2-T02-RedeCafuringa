import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import type { AuthResult } from "../../shared/types";
import { isMockAuthEnabled, login } from "./authService";
import { formatCpf, onlyDigits } from "./cpf";
import { InvalidCredentialsError } from "./errors";
import { demoHint } from "./mockAuth";
import { validateLogin } from "./validateLogin";
import type { LoginErrors } from "./validateLogin";

type LoginPageProps = {
    fromContact?: boolean;
    onNavigate: (path: string) => void;
    onSignIn: (auth: AuthResult) => void;
};

export function LoginPage({
    fromContact = false,
    onNavigate,
    onSignIn,
}: LoginPageProps) {
    const [cpf, setCpf] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<LoginErrors>({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const validationErrors = validateLogin({ cpf, password });
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        let auth: AuthResult;
        try {
            auth = await login({ cpf: onlyDigits(cpf), password });
        } catch (error) {
            setFormError(
                error instanceof InvalidCredentialsError
                    ? "CPF ou senha inválidos"
                    : "Não foi possível entrar agora. Tente novamente em instantes.",
            );
            setLoading(false);
            return;
        }
        onSignIn(auth);
    };

    return (
        <section className="login-page">
            <BackButton label="Voltar" onClick={() => onNavigate("/perfil")} />
            <h1>
                {fromContact
                    ? "Entre para falar com o responsável"
                    : "Que bom ter você aqui"}
            </h1>
            <p className="body-copy">
                {fromContact
                    ? "Acesse sua conta para continuar para o WhatsApp."
                    : "Entre com seu CPF e sua senha."}
            </p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                {formError && (
                    <p className="form-alert" role="alert">
                        {formError}
                    </p>
                )}

                <label className="field-label" htmlFor="login-cpf">
                    CPF
                </label>
                <input
                    id="login-cpf"
                    className="text-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(event) => setCpf(formatCpf(event.target.value))}
                    aria-invalid={Boolean(errors.cpf)}
                    aria-describedby={errors.cpf ? "login-cpf-error" : undefined}
                />
                {errors.cpf && (
                    <p id="login-cpf-error" className="field-error">
                        {errors.cpf}
                    </p>
                )}

                <label className="field-label" htmlFor="login-password">
                    Senha
                </label>
                <input
                    id="login-password"
                    className="text-input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                        errors.password ? "login-password-error" : undefined
                    }
                />
                {errors.password && (
                    <p id="login-password-error" className="field-error">
                        {errors.password}
                    </p>
                )}

                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Entrando…" : "Entrar"}
                    </ActionButton>
                </div>
            </form>

            {isMockAuthEnabled && <p className="demo-note">{demoHint}</p>}
        </section>
    );
}