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

const readRole = (): Role | null => {
    const saved = localStorage.getItem("cafuringa-role");
    const token = localStorage.getItem("cafuringa-token");
    // Administração exige novo login a cada abertura/recarregamento do app.
    // Uma sessão da demonstração também não autentica o ambiente real.
    if (
        saved === "admin" ||
        (!isMockAuthEnabled && token?.startsWith("mock-token-"))
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

    const signIn = ({ token, user }: AuthResult) => {
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
        setConsumerName("");
        setEmail("");
        setCpf("");
        clearStoredSession();
    }, []);

    // Recupera também os dados ausentes de sessões criadas antes da correção
    // do login. O servidor é a fonte dos dados do titular autenticado.
    useEffect(() => {
        const token = localStorage.getItem("cafuringa-token");
        if (isMockAuthEnabled || !token) return;
        let active = true;
        const isCurrentSession = () =>
            active && localStorage.getItem("cafuringa-token") === token;

        void getApiClient()
            .get<components["schemas"]["UserResponse"]>("/auth/me")
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
