import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("inicialização do app (main.tsx)", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("mostra o motivo, em vez de tela em branco, quando a configuração é inválida", async () => {
        vi.stubEnv("VITE_API_URL", "isso-nao-e-uma-url");
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await import("@/main");

        const root = document.getElementById("root")!;
        expect(root.getAttribute("role")).toBe("alert");
        expect(root.textContent).toContain("VITE_API_URL");
        expect(consoleError).toHaveBeenCalled();
    });

    it("renderiza o app quando a configuração é válida", async () => {
        vi.stubEnv("VITE_API_URL", "http://localhost:3000/api/v1");
        vi.stubEnv("VITE_USE_MOCK_AUTH", "true");

        await import("@/main");

        const root = document.getElementById("root")!;
        await waitFor(() => expect(root.children.length).toBeGreaterThan(0));
        expect(root.getAttribute("role")).toBeNull();
    });
});
