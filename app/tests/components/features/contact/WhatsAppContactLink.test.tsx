import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsAppContactLink } from "@/features/contact";

afterEach(cleanup);

const url = "https://wa.me/5561999998888?text=Ol%C3%A1";

describe("HU39 — link de contato pelo WhatsApp", () => {
    it("CA02: é um link para o wa.me que abre em nova aba sem vazar a origem", () => {
        render(<WhatsAppContactLink url={url} />);

        const link = screen.getByRole("link", {
            name: "Conversar pelo WhatsApp (abre em nova aba)",
        });
        expect(link.getAttribute("href")).toBe(url);
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
        expect(link.textContent).toContain("Conversar pelo WhatsApp");
        expect(link.className).toContain("button-green");
    });

    it("RNF04: sem violações WCAG A/AA detectáveis", async () => {
        const { container } = render(<WhatsAppContactLink url={url} />);

        const result = await axe.run(container, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
        });
        expect(result.violations).toEqual([]);
    });

    it("RN17: para visitante é um botão que pede login, sem expor o link do wa.me", () => {
        const onRequireLogin = vi.fn();
        const { container } = render(
            <WhatsAppContactLink url={url} onRequireLogin={onRequireLogin} />,
        );

        expect(screen.queryByRole("link")).toBeNull();
        expect(container.innerHTML).not.toContain("wa.me");
        const button = screen.getByRole("button", {
            name: "Conversar pelo WhatsApp (entre na sua conta para continuar)",
        });
        expect(button.className).toContain("button-green");
        fireEvent.click(button);
        expect(onRequireLogin).toHaveBeenCalledOnce();
    });
});
