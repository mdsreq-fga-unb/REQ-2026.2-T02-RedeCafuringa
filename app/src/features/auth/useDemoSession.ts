import { useState } from "react";
import type { Role } from "../../shared/types";
import { producerName } from "../offers/offerData";

const readRole = (): Role | null => {
    const saved = localStorage.getItem("cafuringa-role");
    return saved === "consumer" || saved === "producer" ? saved : null;
};

export function useDemoSession() {
    const [role, setRole] = useState<Role | null>(readRole);
    const [consumerName, setConsumerName] = useState(
        () => localStorage.getItem("cafuringa-name") || "",
    );
    const [loginName, setLoginName] = useState(
        () => localStorage.getItem("cafuringa-name") || "Visitante Cafuringa",
    );

    const signIn = (nextRole: Role) => {
        const name =
            nextRole === "producer"
                ? producerName
                : loginName.trim() || "Visitante Cafuringa";
        setRole(nextRole);
        setConsumerName(name);
        localStorage.setItem("cafuringa-role", nextRole);
        localStorage.setItem("cafuringa-name", name);
    };

    const signOut = () => {
        setRole(null);
        setConsumerName("");
        localStorage.removeItem("cafuringa-role");
        localStorage.removeItem("cafuringa-name");
    };

    return { role, consumerName, loginName, setLoginName, signIn, signOut };
}
