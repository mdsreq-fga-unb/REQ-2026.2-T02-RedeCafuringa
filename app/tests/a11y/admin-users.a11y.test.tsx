import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { consumer, jsonResponse, userPage } from "../fixtures/adminUsers";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("HU04 — acessibilidade WCAG 2.1 A/AA", () => {
    it.each([false, true])(
        "consulta e detalhe (detalhe=%s) sem violações detectáveis pelo axe",
        async (detail) => {
            localStorage.setItem("cafuringa-role", "admin");
            localStorage.setItem("cafuringa-token", "session");
            window.location.hash = detail
                ? `#/admin/usuarios/${consumer.id}`
                : "#/admin/usuarios";
            vi.stubGlobal(
                "fetch",
                vi
                    .fn<typeof fetch>()
                    .mockImplementation(async () =>
                        jsonResponse(detail ? consumer : userPage),
                    ),
            );
            vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
                null,
            );
            const { container } = render(<App />);
            if (detail) await screen.findByText(consumer.email);
            else
                await screen.findByRole("list", {
                    name: "Usuários cadastrados",
                });
            const result = await axe.run(container, {
                runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                },
                rules: { "color-contrast": { enabled: false } },
            });
            expect(
                result.violations.map(({ id, nodes }) => ({
                    id,
                    nodes: nodes.map((node) => node.target),
                })),
            ).toEqual([]);
        },
    );
});
