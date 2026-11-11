import { isMockAuthEnabled } from "./authMode";

export type DemoResetAction = "users" | "session" | "all";

const sessionKeys = [
    "cafuringa-role",
    "cafuringa-name",
    "cafuringa-token",
    "cafuringa-email",
    "cafuringa-cpf",
    "cafuringa-user-id",
];
const userKeys = ["cafuringa-mock-users", "cafuringa-mock-admin-emails"];
const settingsKeys = [
    "cafuringa-contact",
    "cafuringa-conversations",
    "cafuringa-producer-initiative",
    "cafuringa-producer-category",
    "cafuringa-producer-payment-methods",
];

/** Retorna false fora da demonstração; nunca limpa dados de outras aplicações. */
export function resetDemoData(action: DemoResetAction): boolean {
    if (!isMockAuthEnabled) return false;
    const keys = [
        ...sessionKeys,
        ...(action !== "session" ? userKeys : []),
        ...(action === "all" ? settingsKeys : []),
    ];
    for (const key of keys) localStorage.removeItem(key);
    return true;
}
