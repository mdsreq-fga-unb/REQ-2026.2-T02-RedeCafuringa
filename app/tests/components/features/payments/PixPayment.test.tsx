import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PixPayment } from "@/features/payments/PixPayment";
import { buildPixCode } from "@/features/payments/pixCode";

const props = {
    chave: "maria@exemplo.com",
    nome: "Horta da Maria",
    cidade: "Brasília",
    valorCentavos: 4500,
    txid: "PR1A2B3C",
};
const CODE = buildPixCode(props);

const writeText = vi.fn();

beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    });
});

afterEach(cleanup);

const copyButton = () =>
    screen.getByRole("button", { name: "Copiar código Pix" });

describe("PixPayment — pagar por Pix", () => {
    it("mostra o valor e quem recebe, para conferir no banco", () => {
        render(<PixPayment {...props} />);

        expect(screen.getByText("R$ 45,00")).toBeTruthy();
        expect(screen.getByText("Horta da Maria")).toBeTruthy();
        expect(screen.getByText("Recebedor")).toBeTruthy();
    });

    it("mostra o código copia e cola como texto", () => {
        render(<PixPayment {...props} />);

        const field = screen.getByLabelText(
            "Código Pix copia e cola",
        ) as HTMLTextAreaElement;
        expect(field.value).toBe(CODE);
        expect(field.readOnly).toBe(true);
    });

    it("gera o QR Code no próprio aparelho, com texto alternativo", async () => {
        render(<PixPayment {...props} />);

        const qr = await screen.findByRole("img", {
            name: "QR Code do Pix de R$ 45,00 para Horta da Maria",
        });
        expect(qr.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    });

    it("copia o código e avisa que copiou", async () => {
        render(<PixPayment {...props} />);

        fireEvent.click(copyButton());

        expect(writeText).toHaveBeenCalledWith(CODE);
        expect((await screen.findByRole("status")).textContent).toBe(
            "Código copiado. Cole no app do seu banco, na opção Pix copia e cola.",
        );
    });

    it("se não conseguir copiar, seleciona o código e orienta", async () => {
        writeText.mockRejectedValue(new Error("bloqueado"));
        render(<PixPayment {...props} />);

        fireEvent.click(copyButton());

        expect((await screen.findByRole("status")).textContent).toBe(
            "Não foi possível copiar. O código está selecionado: copie e cole no app do banco.",
        );
        const field = screen.getByLabelText(
            "Código Pix copia e cola",
        ) as HTMLTextAreaElement;
        await waitFor(() => expect(document.activeElement).toBe(field));
        expect(field.selectionStart).toBe(0);
        expect(field.selectionEnd).toBe(CODE.length);
    });

    it("com dados do Pix inválidos, avisa e não mostra código nem QR", () => {
        render(<PixPayment {...props} chave="não é chave" />);

        expect(screen.getByRole("alert").textContent).toBe(
            "O Pix desta produtora não está disponível. Fale com ela para combinar o pagamento.",
        );
        expect(screen.queryByLabelText("Código Pix copia e cola")).toBeNull();
        expect(screen.queryByRole("img")).toBeNull();
        expect(
            screen.queryByRole("button", { name: "Copiar código Pix" }),
        ).toBeNull();
    });

    it("RNF04: sem violações WCAG A/AA", async () => {
        const { container } = render(<PixPayment {...props} />);
        await screen.findByRole("img");

        const report = await axe.run(container, {
            runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            rules: { "color-contrast": { enabled: false } },
        });

        expect(report.violations).toEqual([]);
    });
});
