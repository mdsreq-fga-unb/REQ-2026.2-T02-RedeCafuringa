import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { VideoEmbed } from "@/features/video/VideoEmbed";

afterEach(cleanup);

const ID = "dQw4w9WgXcQ";

describe("VideoEmbed — vídeo do YouTube incorporado", () => {
    it("incorpora o vídeo pelo domínio sem cookies, com título acessível", () => {
        render(<VideoEmbed videoId={ID} title="Queijo minas artesanal" />);

        const frame = screen.getByTitle("Vídeo: Queijo minas artesanal");
        expect(frame.tagName).toBe("IFRAME");
        expect(frame.getAttribute("src")).toBe(
            `https://www.youtube-nocookie.com/embed/${ID}`,
        );
    });

    it("carrega só quando chega perto da tela e não vaza o endereço completo da página", () => {
        render(<VideoEmbed videoId={ID} title="Queijo" />);

        const frame = screen.getByTitle("Vídeo: Queijo");
        expect(frame.getAttribute("loading")).toBe("lazy");
        expect(frame.getAttribute("referrerpolicy")).toBe(
            "strict-origin-when-cross-origin",
        );
        expect(frame.hasAttribute("allowfullscreen")).toBe(true);
    });

    it("oferece o link para assistir no YouTube, em nova aba", () => {
        render(<VideoEmbed videoId={ID} title="Queijo" />);

        const link = screen.getByRole("link", {
            name: "Assistir no YouTube (abre em nova aba)",
        });
        expect(link.getAttribute("href")).toBe(
            `https://www.youtube.com/watch?v=${ID}`,
        );
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it.each([undefined, null, "", "../../evil", "curto"])(
        "sem id válido (%j), não mostra nada",
        (videoId) => {
            const { container } = render(
                <VideoEmbed videoId={videoId} title="Queijo" />,
            );

            expect(container.innerHTML).toBe("");
        },
    );

    it("RNF04: sem violações WCAG A/AA", async () => {
        const { container } = render(
            <VideoEmbed videoId={ID} title="Queijo minas artesanal" />,
        );

        const report = await axe.run(container, {
            runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            rules: { "color-contrast": { enabled: false } },
        });

        expect(report.violations).toEqual([]);
    });
});
