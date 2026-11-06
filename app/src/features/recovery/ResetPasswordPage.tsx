import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { BackButton } from "@/components/navigation/BackButton";
import { resetPassword } from "./recoveryService";
import { validateNewPassword } from "./recoveryValidation";
import type { NewPasswordErrors } from "./recoveryValidation";

type ResetPasswordPageProps = {
    /** Token do link de recuperação (`#/redefinir-senha?token=...`); null se faltar. */
    token: string | null;
    onNavigate: (path: string) => void;
};

export function ResetPasswordPage({
    token,
    onNavigate,
}: ResetPasswordPageProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<NewPasswordErrors>({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [tokenRejected, setTokenRejected] = useState(false);
    const cleanToken = (token ?? "").trim();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const validationErrors = validateNewPassword({
            password,
            confirmPassword,
        });
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        const result = await resetPassword({ token: cleanToken, password });
        setLoading(false);

        if (result.ok) {
            onNavigate("/entrar?recuperacao=ok");
            return;
        }
        if (result.reason === "invalid_token") {
            setTokenRejected(true);
            return;
        }
        setFormError(
            result.reason === "rate_limit"
                ? result.retryAfterSeconds
                    ? `Muitas tentativas. Tente novamente em ${result.retryAfterSeconds} segundos.`
                    : "Muitas tentativas. Aguarde alguns instantes e tente novamente."
                : "Não foi possível redefinir a senha agora. Tente novamente em instantes.",
        );
    };

    if (!cleanToken || tokenRejected) {
        return (
            <section className="login-page recovery-page">
                <h1>Link de recuperação inválido</h1>
                <p className="body-copy">
                    Este link está incorreto ou expirou. Peça um novo link para
                    continuar.
                </p>
                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="button"
                        onClick={() => onNavigate("/recuperar-acesso")}
                    >
                        Pedir novo link
                    </ActionButton>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => onNavigate("/entrar")}
                    >
                        Voltar para entrar
                    </ActionButton>
                </div>
            </section>
        );
    }

    return (
        <section className="login-page recovery-page">
            <BackButton label="Voltar" onClick={() => onNavigate("/entrar")} />
            <h1>Crie uma nova senha</h1>
            <p className="body-copy">Etapa acessada pelo link de recuperação.</p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                {formError && (
                    <p className="form-alert" role="alert">
                        {formError}
                    </p>
                )}

                <label className="field-label" htmlFor="reset-password">
                    Nova senha
                </label>
                <input
                    id="reset-password"
                    className="text-input"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                        errors.password ? "reset-password-error" : undefined
                    }
                />
                {errors.password && (
                    <p id="reset-password-error" className="field-error">
                        {errors.password}
                    </p>
                )}

                <label className="field-label" htmlFor="reset-confirm-password">
                    Confirmar nova senha
                </label>
                <input
                    id="reset-confirm-password"
                    className="text-input"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                        errors.confirmPassword
                            ? "reset-confirm-password-error"
                            : undefined
                    }
                />
                {errors.confirmPassword && (
                    <p id="reset-confirm-password-error" className="field-error">
                        {errors.confirmPassword}
                    </p>
                )}

                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Salvando…" : "Salvar e entrar"}
                    </ActionButton>
                </div>
            </form>
        </section>
    );
}