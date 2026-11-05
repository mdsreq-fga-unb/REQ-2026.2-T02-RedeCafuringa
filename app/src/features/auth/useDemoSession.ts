import { useState } from "react";
import type { AuthResult, Role } from "../../shared/types";

const readRole = (): Role | null => {
    const saved = localStorage.getItem("cafuringa-role");
    return saved === "consumer" || saved === "producer" || saved === "admin"
        ? saved
        : null;
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

    const signOut = () => {
        setRole(null);
        setConsumerName("");
        setEmail("");
        setCpf("");
        localStorage.removeItem("cafuringa-role");
        localStorage.removeItem("cafuringa-name");
        localStorage.removeItem("cafuringa-token");
        localStorage.removeItem("cafuringa-email");
        localStorage.removeItem("cafuringa-cpf");
    };

    return { role, consumerName, email, cpf, signIn, signOut };
}
