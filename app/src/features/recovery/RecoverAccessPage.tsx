import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { BackButton } from "@/components/navigation/BackButton";
import { requestAccessRecovery } from "./recoveryService";
import type { RecoverAccessResult } from "./recoveryService";
import { validateRecoveryRequest } from "./recoveryValidation";
import { rateLimitMessage } from "./recoveryMessages";

type RecoverAccessPageProps = {
    onNavigate: (path: string) => void;
    /** Só no modo de demonstração: link que substitui o e-mail real. */
    getDemoLink?: (email: string) => string | null;
};

function failureMessage(
    result: Exclude<RecoverAccessResult, { ok: true }>,
): string {
    if (result.reason === "rate_limit") {
        return rateLimitMessage(result.retryAfterSeconds);
    }
    return "Não foi possível enviar as instruções agora. Tente novamente em instantes.";
}

export function RecoverAccessPage({
    onNavigate,
    getDemoLink,
}: RecoverAccessPageProps) {
    const [email, setEmail] = useState("");
    const [fieldError, setFieldError] = useState("");
    const [formError, setFormError] = useState("");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [resent, setResent] = useState(false);
    const [loading, setLoading] = useState(false);

    const send = async (address: string): Promise<boolean> => {
        setLoading(true);
        setFormError("");
        setResent(false);
        const result = await requestAccessRecovery(address);
        setLoading(false);
        if (!result.ok) {
            setFormError(failureMessage(result));
            return false;
        }
        return true;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { email: emailError } = validateRecoveryRequest({ email });
        setFieldError(emailError ?? "");
        if (emailError) return;

        const address = email.trim();
        if (await send(address)) setSentTo(address);
    };

    const handleResend = async () => {
        if (sentTo && (await send(sentTo))) setResent(true);
    };

    const handleBackToForm = () => {
        setSentTo(null);
        setFormError("");
        setResent(false);
    };

    if (sentTo) {
        const demoLink = getDemoLink?.(sentTo) ?? null;

        return (
            <section className="login-page recovery-page">
                <BackButton label="Voltar" onClick={handleBackToForm} />
                <div className="recovery-icon" aria-hidden="true">
                    ✓
                </div>
                <h1>Confira seu e-mail</h1>
                <p className="body-copy">
                    Se houver uma conta com esse endereço, você receberá as
                    instruções para recuperar o acesso.
                </p>

                <p className="recovery-sent" role="status">
                    {`Endereço informado: ${sentTo}`}
                </p>

                <p className="body-copy">
                    Não recebeu? Confira se digitou o e-mail certo e olhe a
                    caixa de spam. Se você ainda não tem conta, faça seu
                    cadastro.
                </p>

                {resent && (
                    <p className="form-notice" role="status">
                        E-mail reenviado.
                    </p>
                )}
                {formError && (
                    <p className="form-alert" role="alert">
                        {formError}
                    </p>
                )}

                {demoLink && (
                    <p className="demo-note">
                        Demonstração:{" "}
                        <a href={demoLink}>abrir link de redefinição</a>
                    </p>
                )}

                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="button"
                        disabled={loading}
                        onClick={handleResend}
                    >
                        {loading ? "Reenviando…" : "Reenviar e-mail"}
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
            <h1>Vamos recuperar seu acesso</h1>
            <p className="body-copy">
                Informe seu e-mail cadastrado para receber as instruções.
            </p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                {formError && (
                    <p className="form-alert" role="alert">
                        {formError}
                    </p>
                )}

                <label className="field-label" htmlFor="recovery-email">
                    E-mail
                </label>
                <input
                    id="recovery-email"
                    className="text-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="ana@exemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={
                        fieldError ? "recovery-email-error" : undefined
                    }
                />
                {fieldError && (
                    <p id="recovery-email-error" className="field-error">
                        {fieldError}
                    </p>
                )}

                <div className="login-actions">
                    <ActionButton
                        variant="orange"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Enviando…" : "Enviar instruções"}
                    </ActionButton>
                </div>
            </form>
        </section>
    );
}
