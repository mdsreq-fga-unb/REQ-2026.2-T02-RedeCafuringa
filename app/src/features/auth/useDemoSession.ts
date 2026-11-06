import { useCallback, useState } from "react";
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

    return { role, consumerName, email, cpf, signIn, signOut };
}
