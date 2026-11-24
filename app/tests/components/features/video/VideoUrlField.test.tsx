import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoUrlField } from "@/features/video/VideoUrlField";
import { VIDEO_URL_ERROR } from "@/features/video/youtube";

afterEach(cleanup);

const LINK = "https://youtu.be/dQw4w9WgXcQ";

function Controlled({
    error,
    onChange = () => {},
}: {
    error?: string;
    onChange?: (value: string) => void;
}) {
    const [value, setValue] = useState("");
    return (
        <VideoUrlField
            id="video"
            value={value}
            error={error}
            onChange={(next) => {
                setValue(next);
                onChange(next);
            }}
        />
    );
}

const input = () =>
    screen.getByRole("textbox", { name: "Vídeo do YouTube (opcional)" });
const preview = () => screen.queryByTitle("Vídeo: prévia do link informado");

describe("VideoUrlField — link do vídeo no cadastro", () => {
    it("é um campo de link opcional, com a orientação associada", () => {
        render(<VideoUrlField id="video" value="" onChange={() => {}} />);

        expect(input().getAttribute("type")).toBe("url");
        expect(input().getAttribute("inputmode")).toBe("url");
        expect((input() as HTMLInputElement).required).toBe(false);
        expect(input().getAttribute("aria-invalid")).toBeNull();
        expect(input().getAttribute("aria-describedby")).toBe("video-hint");
        expect(document.getElementById("video-hint")?.textContent).toBe(
            "Cole o link do vídeo, por exemplo https://youtu.be/…",
        );
    });

    it("repassa o que a pessoa digita", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Controlled onChange={onChange} />);

        await user.type(input(), LINK);

        expect(onChange).toHaveBeenLastCalledWith(LINK);
        expect((input() as HTMLInputElement).value).toBe(LINK);
    });

    it("mostra o erro informado pelo formulário e o associa ao campo", () => {
        render(
            <VideoUrlField
                id="video"
                value="https://vimeo.com/1"
                error={VIDEO_URL_ERROR}
                onChange={() => {}}
            />,
        );

        expect(screen.getByRole("alert").textContent).toBe(VIDEO_URL_ERROR);
        expect(input().getAttribute("aria-invalid")).toBe("true");
        expect(input().getAttribute("aria-describedby")).toBe(
            "video-hint video-error",
        );
    });

    it("com um link válido, mostra a prévia do vídeo", async () => {
        const user = userEvent.setup();
        render(<Controlled />);
        expect(preview()).toBeNull();

        await user.type(input(), LINK);

        expect(preview()?.getAttribute("src")).toBe(
            "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        );
    });

    it("com um link inválido, não mostra prévia", () => {
        render(
            <VideoUrlField
                id="video"
                value="https://vimeo.com/1"
                onChange={() => {}}
            />,
        );

        expect(preview()).toBeNull();
    });

    it("fica desabilitado enquanto o formulário envia", () => {
        render(
            <VideoUrlField id="video" value="" disabled onChange={() => {}} />,
        );

        expect((input() as HTMLInputElement).disabled).toBe(true);
    });

    it.each([
        ["sem erro, com prévia", LINK, undefined],
        ["com erro", "https://vimeo.com/1", VIDEO_URL_ERROR],
    ])("RNF04: sem violações WCAG A/AA %s", async (_caso, value, error) => {
        const { container } = render(
            <VideoUrlField
                id="video"
                value={value}
                error={error}
                onChange={() => {}}
            />,
        );

        const report = await axe.run(container, {
            iframes: false,
            runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            rules: { "color-contrast": { enabled: false } },
        });

        expect(report.violations).toEqual([]);
    });
});
