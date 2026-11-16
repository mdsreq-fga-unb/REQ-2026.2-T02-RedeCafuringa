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
    recovered?: boolean;
    onNavigate: (path: string) => void;
    onSignIn: (auth: AuthResult) => void;
};

export function LoginPage({
    fromContact = false,
    profile = "producer",
    registered = false,
    recovered = false,
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

    const subtitle = fromContact
        ? "Acesse sua conta para continuar para o WhatsApp."
        : profile === "consumer"
          ? "Entre para acompanhar as novidades."
          : "Entre para divulgar seus produtos e serviços.";

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
            <h1 className="login-title-accent">
                {fromContact
                    ? "Entre para falar com o responsável"
                    : "Que bom ter você aqui"}
            </h1>
            <p className="body-copy">{subtitle}</p>

            {registered && (
                <p className="form-notice" role="status">
                    Cadastro concluído. Entre com seu e-mail e sua senha.
                </p>
            )}

            {recovered && (
                <p className="form-notice" role="status">
                    Senha redefinida. Entre com seu e-mail e a nova senha.
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
                    placeholder="E-mail usado no cadastro"
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
                    placeholder="Digite sua senha"
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
                        onClick={() => onNavigate("/recuperar-acesso")}
                    >
                        Esqueci minha senha
                    </ActionButton>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => onNavigate(signupPath)}
                    >
                        Criar uma conta
                    </ActionButton>
                </div>
            </form>

            {!fromContact && (
                <button
                    type="button"
                    className="profile-switch"
                    onClick={() =>
                        onNavigate(
                            profile === "consumer"
                                ? "/login/producer"
                                : "/login/consumer",
                        )
                    }
                >
                    {profile === "consumer" ? "Sou produtor" : "Sou consumidor"}{" "}
                    <span aria-hidden="true">→</span>
                </button>
            )}

            {isMockAuthEnabled && <p className="demo-note">{demoHint}</p>}
        </section>
    );
}
