import { useCallback, useEffect, useState } from "react";
import { ApiHttpError, getApiClient } from "../../shared/api";
import type { components } from "../../shared/api/schema";
import type { AuthResult, Role } from "../../shared/types";
import { isMockAuthEnabled } from "./authMode";

const sessionKeys = [
    "cafuringa-role",
    "cafuringa-name",
    "cafuringa-token",
    "cafuringa-email",
    "cafuringa-cpf",
];

function clearStoredSession() {
    for (const key of sessionKeys) localStorage.removeItem(key);
}

/**
 * Instante (ms) em que o JWT expira, lido do campo `exp` só para decidir a
 * interface. Quem recusa o token de verdade é o servidor. Devolve null quando o
 * token não é um JWT legível (ex.: sessão de demonstração).
 */
function tokenExpiryMs(token: string | null): number | null {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    try {
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const exp = (JSON.parse(json) as { exp?: unknown }).exp;
        return typeof exp === "number" ? exp * 1000 : null;
    } catch {
        return null;
    }
}

// setTimeout estoura acima de 2^31 - 1 ms (cerca de 24 dias).
const MAX_TIMER_MS = 2 ** 31 - 1;

const readRole = (): Role | null => {
    const saved = localStorage.getItem("cafuringa-role");
    const token = localStorage.getItem("cafuringa-token");
    const expiry = tokenExpiryMs(token);
    // Administração exige novo login a cada abertura/recarregamento do app.
    // Uma sessão da demonstração também não autentica o ambiente real.
    // Token já vencido (JWT de 15 min, sem renovação) não abre sessão.
    if (
        saved === "admin" ||
        (!isMockAuthEnabled && token?.startsWith("mock-token-")) ||
        (expiry !== null && expiry <= Date.now())
    ) {
        clearStoredSession();
        return null;
    }
    return saved === "consumer" || saved === "producer" ? saved : null;
};

export function useDemoSession() {
    const [role, setRole] = useState<Role | null>(readRole);
    const [consumerName, setConsumerName] = useState(
        () => localStorage.getItem("cafuringa-name") || "",
    );
    const [email, setEmail] = useState(
        () => localStorage.getItem("cafuringa-email") || "",
    );
    const [cpf, setCpf] = useState(
        () => localStorage.getItem("cafuringa-cpf") || "",
    );
    // Lido depois do `role`, que já limpou um token vencido do armazenamento.
    const [sessionToken, setSessionToken] = useState(() =>
        localStorage.getItem("cafuringa-token"),
    );

    const signIn = ({ token, user }: AuthResult) => {
        setSessionToken(token);
        setRole(user.role);
        setConsumerName(user.name);
        setEmail(user.email ?? "");
        setCpf(user.cpf ?? "");
        localStorage.setItem("cafuringa-role", user.role);
        localStorage.setItem("cafuringa-name", user.name);
        localStorage.setItem("cafuringa-token", token);
        if (user.email) localStorage.setItem("cafuringa-email", user.email);
        else localStorage.removeItem("cafuringa-email");
        if (user.cpf) localStorage.setItem("cafuringa-cpf", user.cpf);
        else localStorage.removeItem("cafuringa-cpf");
    };

    const signOut = useCallback(() => {
        setRole(null);
        setSessionToken(null);
        setConsumerName("");
        setEmail("");
        setCpf("");
        clearStoredSession();
    }, []);

    // O JWT vale 15 minutos e não é renovado: quando vence, a interface deixa de
    // mostrar áreas que a API já recusa e leva a um novo login.
    useEffect(() => {
        if (role === null) return;
        const expiry = tokenExpiryMs(sessionToken);
        if (expiry === null) return;
        const timer = setTimeout(
            signOut,
            Math.min(Math.max(0, expiry - Date.now()), MAX_TIMER_MS),
        );
        return () => clearTimeout(timer);
    }, [role, sessionToken, signOut]);

    // Recupera também os dados ausentes de sessões criadas antes da correção
    // do login. O servidor é a fonte dos dados do titular autenticado.
    useEffect(() => {
        const token = localStorage.getItem("cafuringa-token");
        if (isMockAuthEnabled || !token) return;
        let active = true;
        const isCurrentSession = () =>
            active && localStorage.getItem("cafuringa-token") === token;

        void getApiClient()
            .get<components["schemas"]["UserResponse"]>("/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((user) => {
                if (!isCurrentSession()) return;
                setConsumerName(user.nome);
                setEmail(user.email);
                setCpf(user.cpf ?? "");
                localStorage.setItem("cafuringa-name", user.nome);
                localStorage.setItem("cafuringa-email", user.email);
                if (user.cpf) localStorage.setItem("cafuringa-cpf", user.cpf);
                else localStorage.removeItem("cafuringa-cpf");
            })
            .catch((error: unknown) => {
                if (
                    isCurrentSession() &&
                    error instanceof ApiHttpError &&
                    (error.status === 401 || error.status === 403)
                )
                    signOut();
            });

        return () => {
            active = false;
        };
    }, [signOut]);

    return { role, consumerName, email, cpf, signIn, signOut };
}
