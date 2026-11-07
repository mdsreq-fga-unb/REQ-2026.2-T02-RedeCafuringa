import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthResult } from "@/shared/types";
import { login } from "@/features/auth/authService";
import { buildRegisterPayload } from "@/features/register/registerForm";
import type { RegisterFormValues } from "@/features/register/registerForm";
import { registerProducer } from "@/features/register/registerService";
import { emptyTrajectory, trajectoryBody } from "./trajectoryModel";
import type { TrajectoryDraft } from "./trajectoryModel";
import { saveTrajectory, trajectoryError } from "./trajectoryService";
import { ApiHttpError } from "@/shared/api";

export function useProducerSignup(onSuccess: (auth: AuthResult) => void) {
    const [details, setDetails] = useState<RegisterFormValues | null>(null);
    const [draft, setDraft] = useState<TrajectoryDraft>(emptyTrajectory);
    const [error, setError] = useState("");
    const [created, setCreated] = useState(false);
    const auth = useRef<AuthResult | null>(null);
    const busy = useRef(false);
    const active = useRef(true);
    const generation = useRef(0);
    useEffect(
        () => () => {
            active.current = false;
        },
        [],
    );

    const reset = useCallback(() => {
        active.current = false;
        generation.current += 1;
        setDetails(null);
        setDraft(emptyTrajectory);
        setError("");
        setCreated(false);
        auth.current = null;
    }, []);
    const start = (values: RegisterFormValues) => {
        if (!details)
            setDraft((current) => ({ ...current, phone: values.phone }));
        generation.current += 1;
        active.current = true;
        setDetails(values);
        setError("");
    };
    const submit = async () => {
        if (!details || busy.current) return;
        busy.current = true;
        setError("");
        const currentGeneration = generation.current;
        const isCurrent = () =>
            active.current && generation.current === currentGeneration;
        let phase: "register" | "login" | "trajectory" = "register";
        try {
            if (!created) {
                const result = await registerProducer(
                    buildRegisterPayload(details),
                );
                if (!isCurrent()) return;
                if (!result.ok) {
                    if (result.reason === "duplicate")
                        throw new Error(
                            result.field === "email"
                                ? "E-mail já cadastrado. Entre na sua conta ou corrija os dados anteriores."
                                : result.field === "cnpj"
                                  ? "CNPJ já cadastrado. Confira os dados anteriores."
                                  : "CPF/CNPJ ou e-mail já cadastrado. Confira os dados anteriores ou entre na sua conta.",
                        );
                    if (result.reason === "invalid")
                        throw new Error(result.messages.join(" "));
                    if (result.reason === "rate_limit")
                        throw new Error(
                            result.retryAfterSeconds
                                ? `Muitas tentativas. Aguarde ${result.retryAfterSeconds} segundos.`
                                : "Muitas tentativas. Aguarde e tente novamente.",
                        );
                    throw new Error(
                        "Não foi possível concluir o cadastro. Verifique a conexão e tente novamente.",
                    );
                }
                setCreated(true);
            }
            if (!auth.current) {
                phase = "login";
                const result = await login({
                    email: details.email,
                    password: details.password,
                });
                if (!isCurrent()) return;
                auth.current = result;
            }
            phase = "trajectory";
            await saveTrajectory(trajectoryBody(draft), auth.current.token);
            if (isCurrent()) {
                const result = auth.current;
                // O App limpa o rascunho ao sair da rota. Limpá-lo aqui,
                // antes da navegação, acionaria a proteção de etapa sem dados.
                onSuccess(result);
            }
        } catch (cause) {
            if (isCurrent()) {
                if (cause instanceof ApiHttpError && cause.status === 401)
                    auth.current = null;
                setError(
                    phase === "login"
                        ? "Sua conta foi criada, mas não foi possível entrar para registrar a trajetória. Verifique a conexão e tente novamente."
                        : cause instanceof Error &&
                            !("status" in cause) &&
                            cause.name === "Error"
                          ? cause.message
                          : trajectoryError(cause),
                );
            }
        } finally {
            busy.current = false;
        }
    };
    return {
        details,
        draft,
        setDraft,
        start,
        submit,
        error,
        created,
        reset,
    };
}
