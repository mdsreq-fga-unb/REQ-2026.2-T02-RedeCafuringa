import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.resetModules();
});

async function load(enabled: boolean) {
    vi.stubEnv("VITE_USE_MOCK_AUTH", String(enabled));
    vi.resetModules();
    return import("@/features/auth/demoTools");
}

describe("ferramentas de demonstração", () => {
    it("não altera dados com mock desativado", async () => {
        const { resetDemoData } = await load(false);
        localStorage.setItem("cafuringa-mock-users", "cadastro");
        expect(resetDemoData("all")).toBe(false);
        expect(localStorage.getItem("cafuringa-mock-users")).toBe("cadastro");
    });

    it("apaga cadastros e sessão preservando configurações e dados alheios", async () => {
        const { resetDemoData } = await load(true);
        for (const key of [
            "cafuringa-mock-users",
            "cafuringa-mock-admin-emails",
            "cafuringa-token",
            "cafuringa-contact",
            "outro-app",
        ])
            localStorage.setItem(key, "teste");
        expect(resetDemoData("users")).toBe(true);
        expect(localStorage.getItem("cafuringa-mock-users")).toBeNull();
        expect(localStorage.getItem("cafuringa-mock-admin-emails")).toBeNull();
        expect(localStorage.getItem("cafuringa-token")).toBeNull();
        expect(localStorage.getItem("cafuringa-contact")).toBe("teste");
        expect(localStorage.getItem("outro-app")).toBe("teste");
    });

    it("encerra somente a sessão ou restaura toda a demonstração", async () => {
        const { resetDemoData } = await load(true);
        localStorage.setItem("cafuringa-mock-users", "teste");
        localStorage.setItem("cafuringa-producer-initiative", "teste");
        localStorage.setItem("cafuringa-role", "producer");
        resetDemoData("session");
        expect(localStorage.getItem("cafuringa-role")).toBeNull();
        expect(localStorage.getItem("cafuringa-mock-users")).toBe("teste");
        resetDemoData("all");
        expect(localStorage.getItem("cafuringa-mock-users")).toBeNull();
        expect(
            localStorage.getItem("cafuringa-producer-initiative"),
        ).toBeNull();
    });
});
