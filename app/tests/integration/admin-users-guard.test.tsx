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
                const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
                    new Response(
                        JSON.stringify({
                            id: "665f1c2e9b1d4a0012ab34c1",
                            nome: "Usuário",
                            email: "usuario@example.com",
                            perfil:
                                role === "producer" ? "PRODUTOR" : "CONSUMIDOR",
                        }),
                        { headers: { "content-type": "application/json" } },
                    ),
                );
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
                if (role === "consumer" || role === "producer") {
                    // O titular pode consultar o próprio perfil, mas nenhuma
                    // consulta administrativa pode sair antes da autorização.
                    expect(fetchMock).toHaveBeenCalledTimes(1);
                    const [url, init] = fetchMock.mock.calls[0];
                    expect(String(url)).toBe("/api/v1/auth/me");
                    expect(init?.headers).toMatchObject({
                        Authorization: "Bearer non-admin-token",
                    });
                } else {
                    expect(fetchMock).not.toHaveBeenCalled();
                }
            },
        );
    }
});
