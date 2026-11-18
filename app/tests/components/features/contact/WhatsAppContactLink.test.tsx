import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
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
        expect(link.classList.contains("button-whatsapp")).toBe(true);
    });

    it("RNF04: sem violações WCAG A/AA detectáveis", async () => {
        const { container } = render(<WhatsAppContactLink url={url} />);

        const result = await axe.run(container, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
        });
        expect(result.violations).toEqual([]);
    });
});
