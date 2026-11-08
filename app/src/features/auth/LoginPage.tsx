import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import type { AuthResult } from "../../shared/types";
import { isMockAuthEnabled, login } from "./authService";
import {
    AccountDisabledError,
    InvalidCredentialsError,
    TooManyAttemptsError,
} from "./errors";
import { demoHint } from "./mockAuth";
import { validateLogin } from "./validateLogin";
import type { LoginErrors } from "./validateLogin";

function waitText(seconds?: number): string {
    if (!seconds || seconds <= 0) return "alguns instantes";
    if (seconds < 60)
        return seconds === 1 ? "1 segundo" : `${seconds} segundos`;
    const minutes = Math.ceil(seconds / 60);
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

/** Mensagem orientativa por causa da falha (RNF03): o que aconteceu e o que fazer. */
function loginErrorMessage(error: unknown): string {
    if (error instanceof InvalidCredentialsError) {
        return "E-mail ou senha inválidos";
    }
    if (error instanceof AccountDisabledError) {
        return "Conta desativada. Procure a administração da Rede Cafuringa.";
    }
    if (error instanceof TooManyAttemptsError) {
        return `Muitas tentativas de login. Aguarde ${waitText(error.retryAfterSeconds)} e tente novamente.`;
    }
    return "Não foi possível entrar agora. Tente novamente em instantes.";
}

type LoginPageProps = {
    fromContact?: boolean;
    profile?: "consumer" | "producer";
    registered?: boolean;
    onNavigate: (path: string) => void;
    onSignIn: (auth: AuthResult) => void;
};

export function LoginPage({
    fromContact = false,
    profile = "producer",
    registered = false,
    onNavigate,
    onSignIn,
}: LoginPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<LoginErrors>({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const signupPath =
        profile === "consumer" ? "/cadastro/consumidor" : "/cadastro";
    const signupLabel =
        profile === "consumer"
            ? "Criar conta de consumidor"
            : "Criar conta de produtor";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const validationErrors = validateLogin({ email, password });
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        let auth: AuthResult;
        try {
            auth = await login({ email, password });
        } catch (error) {
            setFormError(loginErrorMessage(error));
            setLoading(false);
            return;
        }
        onSignIn(auth);
    };

    return (
        <section className="login-page">
            <BackButton
                label="Voltar"
                onClick={() =>
                    onNavigate(fromContact ? "/perfil" : "/escolher-perfil")
                }
            />
            <h1>
                {fromContact
                    ? "Entre para falar com o responsável"
                    : "Que bom ter você aqui"}
            </h1>
            <p className="body-copy">
                {fromContact
                    ? "Acesse sua conta para continuar para o WhatsApp."
                    : "Entre com seu e-mail e sua senha."}
            </p>

            {registered && (
                <p className="form-notice" role="status">
                    Cadastro concluído. Entre com seu e-mail e sua senha.
                </p>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                {formError && (
                    <p className="form-alert" role="alert">
                        {formError}
                    </p>
                )}

                <label className="field-label" htmlFor="login-email">
                    E-mail
                </label>
                <input
                    id="login-email"
                    className="text-input"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                        errors.email ? "login-email-error" : undefined
                    }
                />
                {errors.email && (
                    <p id="login-email-error" className="field-error">
                        {errors.email}
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
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => onNavigate(signupPath)}
                    >
                        {signupLabel}
                    </ActionButton>
                </div>
            </form>

            {isMockAuthEnabled && <p className="demo-note">{demoHint}</p>}
        </section>
    );
}
