import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

describe("HU04 — CA07/RN01/RN03/RNF08", () => {
    for (const route of [
        "#/admin/usuarios",
        "#/admin/usuarios/665f1c2e9b1d4a0012ab34c1",
    ]) {
        it.each([null, "consumer", "producer", "admin"])(
            `bloqueia perfil %s em ${route} antes de consultar dados`,
            async (role) => {
                localStorage.clear();
                if (role) {
                    localStorage.setItem("cafuringa-role", role);
                    localStorage.setItem("cafuringa-token", "non-admin-token");
                }
                const fetchMock = vi.fn<typeof fetch>();
                vi.stubGlobal("fetch", fetchMock);
                window.location.hash = route;
                render(<App />);
                expect(
                    screen.queryByRole("heading", {
                        name: /usuários cadastrados/i,
                    }),
                ).toBeNull();
                await waitFor(() =>
                    expect(window.location.hash).toBe("#/admin/entrar"),
                );
                expect(fetchMock).not.toHaveBeenCalled();
            },
        );
    }
});
