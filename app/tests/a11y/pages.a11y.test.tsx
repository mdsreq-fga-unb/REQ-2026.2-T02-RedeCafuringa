import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { login } from "@/features/auth/authService";
import userEvent from "@testing-library/user-event";
import { requestAccessRecovery } from "@/features/recovery/recoveryService";
import { getProductDetails } from "@/features/offers/productDetailsService";
import { listProducts } from "@/features/offers/productService";
import type { Product } from "@/features/offers/productTypes";

vi.mock("@/features/offers/productService");
vi.mock("@/features/offers/productDetailsService");
vi.mock("@/features/auth/authService");
vi.mock("@/features/recovery/recoveryService");
vi.mock("@/features/auth/authService");

// WCAG 2.1 níveis A e AA. O color-contrast fica de fora porque o jsdom não calcula
// layout nem cores: o contraste é garantido por tests/a11y/contrast.test.ts (tokens de
// cor) e pela verificação em navegador real.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const ROUTES = [
    "/perfil",
    "/catalogo",
    "/entrar",
    "/cadastro",
    "/conta",
    "/oferta/queijos",
    "/oferta/mel",
    "/recuperar-acesso",
    "/nova-senha?token=abc123",
    "/nova-senha",
];

const catalogProducts: Product[] = [
    {
        id: "mel",
        name: "Mel do Cerrado",
        producerName: "Dona Maria",
        price: 32,
        unit: "unidade",
        image: "https://exemplo.com/mel.jpg",
    },
    {
        id: "cesta",
        name: "Cesta da estação",
        producerName: "Sítio Raízes",
        price: 40,
        unit: "cesta",
        image: "https://exemplo.com/cesta.jpg",
    },
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
    vi.mocked(requestAccessRecovery).mockResolvedValue({ ok: true });
    vi.mocked(listProducts).mockResolvedValue(catalogProducts);
    vi.mocked(getProductDetails).mockImplementation(
        async (id) => catalogProducts.find((item) => item.id === id) ?? null,
    );
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

        expect(await screen.findByLabelText("E-mail")).toBeTruthy();
        expect(screen.getByLabelText("Senha")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("o formulário de cadastro tem rótulos e campos acessíveis", async () => {
        window.location.hash = "#/cadastro";
        const { container } = render(<App />);

        expect(await screen.findByLabelText("Nome da iniciativa")).toBeTruthy();
        expect(screen.getByLabelText("CPF")).toBeTruthy();
        expect(screen.getByLabelText("Telefone")).toBeTruthy();
        expect(screen.getByLabelText("E-mail")).toBeTruthy();
        expect(screen.getByLabelText("Localidade")).toBeTruthy();
        expect(screen.getByLabelText("Senha")).toBeTruthy();
        expect(screen.getByLabelText("Confirmar senha")).toBeTruthy();
        expect(screen.getByLabelText("Data de nascimento")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("o cadastro com erros por campo continua sem violações", async () => {
        window.location.hash = "#/cadastro";
        const { container } = render(<App />);

        await userEvent
            .setup()
            .click(await screen.findByRole("button", { name: "Continuar" }));

        expect(await screen.findByText("Informe o nome.")).toBeTruthy();
        expect(
            screen
                .getByLabelText("Nome da iniciativa")
                .getAttribute("aria-invalid"),
        ).toBe("true");
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

    it("o formulário de recuperação de acesso tem rótulo e campo acessíveis", async () => {
        window.location.hash = "#/recuperar-acesso";
        const { container } = render(<App />);

        expect(await screen.findByLabelText("E-mail")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("a recuperação com erro no e-mail continua sem violações", async () => {
        window.location.hash = "#/recuperar-acesso";
        const { container } = render(<App />);

        await userEvent.setup().click(
            await screen.findByRole("button", {
                name: "Enviar instruções",
            }),
        );

        expect(await screen.findByText("Informe o e-mail.")).toBeTruthy();
        expect(
            screen.getByLabelText("E-mail").getAttribute("aria-invalid"),
        ).toBe("true");
        expect(await violationsIn(container)).toEqual([]);
    });

    it("a confirmação de envio do e-mail de recuperação não tem violações", async () => {
        window.location.hash = "#/recuperar-acesso";
        const { container } = render(<App />);
        const user = userEvent.setup();

        await user.type(
            await screen.findByLabelText("E-mail"),
            "ana@exemplo.com",
        );
        await user.click(
            screen.getByRole("button", { name: "Enviar instruções" }),
        );

        expect(
            await screen.findByRole("heading", { name: "Confira seu e-mail" }),
        ).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("o formulário de nova senha tem rótulos e campos acessíveis", async () => {
        window.location.hash = "#/nova-senha?token=abc123";
        const { container } = render(<App />);

        expect(await screen.findByLabelText("Nova senha")).toBeTruthy();
        expect(screen.getByLabelText("Confirmar nova senha")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("a nova senha com erros por campo continua sem violações", async () => {
        window.location.hash = "#/nova-senha?token=abc123";
        const { container } = render(<App />);

        await userEvent
            .setup()
            .click(
                await screen.findByRole("button", { name: "Salvar e entrar" }),
            );

        expect(await screen.findByText("Informe a nova senha.")).toBeTruthy();
        expect(
            screen.getByLabelText("Nova senha").getAttribute("aria-invalid"),
        ).toBe("true");
        expect(await violationsIn(container)).toEqual([]);
    });

    it("o catálogo de produtos carregado não tem violações", async () => {
        window.location.hash = "#/produtos";
        const { container } = render(<App />);

        expect(await screen.findByText("Mel do Cerrado")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });

    it("o catálogo de produtos com erro ao carregar não tem violações", async () => {
        vi.mocked(listProducts).mockRejectedValue(new Error("falhou"));
        window.location.hash = "#/produtos";
        const { container } = render(<App />);

        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(await violationsIn(container)).toEqual([]);
    });
});
