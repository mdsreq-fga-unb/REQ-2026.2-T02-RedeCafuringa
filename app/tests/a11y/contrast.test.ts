import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Contraste WCAG 2.1 (fórmula da W3C). Cobre o que o jsdom não consegue medir:
// as combinações de cor do design, lidas direto de src/App.css.
function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

// O Vitest roda com a raiz do app como diretório atual (no jsdom, import.meta.url não é
// uma URL de arquivo).
const css = readFileSync(resolve(process.cwd(), "src/App.css"), "utf8");

function token(name: string): string {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    expect(match, `token --${name} em App.css`).not.toBeNull();
    return match![1];
}

// Fundos reais do app: --paper (tela) e o card, que é #fffefa em App.css.
const CARD = "#fffefa";
const AA_TEXT = 4.5;
const AA_UI = 3;

describe("contraste dos tokens de cor (WCAG 2.1 AA)", () => {
    const paper = token("paper");
    const ink = token("ink");
    const muted = token("muted");
    const orange = token("orange");
    const green = token("green");
    const orangeText = token("orange-text");
    const orangeStrong = token("orange-text-strong");

    it("texto principal e secundário sobre o fundo", () => {
        expect(contrast(ink, paper)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(ink, CARD)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(muted, paper)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(muted, CARD)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it("laranja usada como texto (marca, rótulos, preços, navegação)", () => {
        expect(contrast(orangeText, paper)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(orangeText, CARD)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(orangeStrong, CARD)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it("o estado ativo da navegação é mais escuro que o normal", () => {
        expect(contrast(orangeStrong, CARD)).toBeGreaterThan(
            contrast(orangeText, CARD),
        );
    });

    it("texto escuro sobre os botões laranja e verde", () => {
        expect(contrast(ink, orange)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(ink, green)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(ink, "#52c544")).toBeGreaterThanOrEqual(AA_TEXT); // verde suave
    });

    it("o contorno de foco tem pelo menos 3:1 (WCAG 1.4.11)", () => {
        expect(contrast(orangeText, paper)).toBeGreaterThanOrEqual(AA_UI);
        expect(contrast(orangeText, CARD)).toBeGreaterThanOrEqual(AA_UI);
    });

    it("a laranja da marca pura NÃO serve como texto (regressão)", () => {
        // Se este teste falhar, a marca passou a ter contraste suficiente e os tokens
        // --orange-text podem ser simplificados. Enquanto passar, ele impede que alguém
        // volte a usar var(--orange) como cor de texto.
        expect(contrast(orange, paper)).toBeLessThan(AA_TEXT);
    });

    it("nenhuma regra de texto volta a usar a laranja pura ou branco sobre ela", () => {
        const rules = css.split("}").map((r) => r.trim());
        const textUsesBrandOrange = rules.filter((r) =>
            /(^|[\s;{])color:\s*var\(--orange\)/.test(r),
        );
        expect(
            textUsesBrandOrange,
            "use var(--orange-text) para texto",
        ).toEqual([]);

        const orangeButton = rules.find((r) => r.startsWith(".button-orange"));
        const greenButton = rules.find((r) => r.startsWith(".button-green {"));
        expect(orangeButton).toMatch(/color:\s*var\(--ink\)/);
        expect(greenButton).toMatch(/color:\s*var\(--ink\)/);
    });
});
