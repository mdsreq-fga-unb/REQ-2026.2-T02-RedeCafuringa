import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { login } from "@/features/auth/authService";

vi.mock("@/features/auth/authService");

// WCAG 2.1 níveis A e AA. O color-contrast fica de fora porque o jsdom não calcula
// layout nem cores: o contraste é garantido por tests/a11y/contrast.test.ts (tokens de
// cor) e pela verificação em navegador real.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const ROUTES = [
    "/perfil",
    "/catalogo",
    "/entrar",
    "/conta",
    "/oferta/queijos",
    "/oferta/mel",
];

async function violationsIn(container: HTMLElement) {
    const result = await axe.run(container, {
        runOnly: { type: "tag", values: WCAG_TAGS },
        rules: { "color-contrast": { enabled: false } },
    });
    return result.violations.map(
        (v) =>
            `${v.id} (${v.impact}): ${v.help} -> ${v.nodes
                .map((n) => n.target.join(" "))
                .join(", ")}`,
    );
}

beforeEach(() => {
    // O axe tenta medir ícones com canvas, que o jsdom não implementa e reclama no console.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.mocked(login).mockResolvedValue({
        token: "token-falso",
        user: { id: 1, name: "Gabriela", role: "consumer" },
    });
    localStorage.clear();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    window.location.hash = "";
});

describe("acessibilidade (axe, WCAG 2.1 A/AA)", () => {
    it.each(ROUTES)("a rota %s não tem violações", async (route) => {
        window.location.hash = `#${route}`;
        const { container } = render(<App />);
        await screen.findByRole("banner"); // o cabeçalho da marca já foi desenhado

        expect(await violationsIn(container)).toEqual([]);
    });

    it("o formulário de login tem rótulos e campos acessíveis", async () => {
        window.location.hash = "#/entrar";
        const { container } = render(<App />);

        expect(await screen.findByLabelText("CPF")).toBeTruthy();
        expect(screen.getByLabelText("Senha")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("o axe de fato detecta problemas (controle negativo)", async () => {
        // Sem isso, "zero violações" poderia significar que o axe não está funcionando.
        const { container } = render(
            <div>
                <img src="x.png" />
                <button />
                <input type="text" />
            </div>,
        );

        const found = await violationsIn(container);

        expect(found.some((v) => v.startsWith("image-alt"))).toBe(true);
        expect(found.some((v) => v.startsWith("button-name"))).toBe(true);
        expect(found.some((v) => v.startsWith("label"))).toBe(true);
    });
});
