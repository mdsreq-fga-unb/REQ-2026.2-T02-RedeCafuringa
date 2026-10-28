import { useState } from "react";
import type { AuthResult, Role } from "../../shared/types";

const readRole = (): Role | null => {
    const saved = localStorage.getItem("cafuringa-role");
    return saved === "consumer" || saved === "producer" ? saved : null;
};

export function useDemoSession() {
    const [role, setRole] = useState<Role | null>(readRole);
    const [consumerName, setConsumerName] = useState(
        () => localStorage.getItem("cafuringa-name") || "",
    );

    const signIn = ({ token, user }: AuthResult) => {
        setRole(user.role);
        setConsumerName(user.name);
        localStorage.setItem("cafuringa-role", user.role);
        localStorage.setItem("cafuringa-name", user.name);
        localStorage.setItem("cafuringa-token", token);
    };

    const signOut = () => {
        setRole(null);
        setConsumerName("");
        localStorage.removeItem("cafuringa-role");
        localStorage.removeItem("cafuringa-name");
        localStorage.removeItem("cafuringa-token");
    };

    return { role, consumerName, signIn, signOut };
}