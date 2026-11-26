import { describe, expect, it } from "vitest";
import {
    VIDEO_URL_ERROR,
    extractYoutubeId,
    validateVideoUrl,
    youtubeEmbedUrl,
    youtubeWatchUrl,
} from "@/features/video/youtube";

const ID = "dQw4w9WgXcQ";

describe("vídeo do YouTube — extractYoutubeId", () => {
    it.each([
        `https://www.youtube.com/watch?v=${ID}`,
        `https://youtube.com/watch?v=${ID}&t=42s`,
        `https://m.youtube.com/watch?v=${ID}`,
        `https://youtu.be/${ID}`,
        `https://youtu.be/${ID}?si=abc`,
        `https://www.youtube.com/shorts/${ID}`,
        `https://www.youtube.com/embed/${ID}`,
        `https://www.youtube-nocookie.com/embed/${ID}`,
        `  https://youtu.be/${ID}  `,
        `http://www.youtube.com/watch?v=${ID}`,
    ])("aceita %s", (url) => {
        expect(extractYoutubeId(url)).toBe(ID);
    });

    it.each([
        "",
        "   ",
        "não é um link",
        ID,
        `https://vimeo.com/${ID}`,
        `https://youtube.com.evil.com/watch?v=${ID}`,
        `https://evil.com/youtu.be/${ID}`,
        `javascript:alert(1)//youtube.com/watch?v=${ID}`,
        `ftp://youtube.com/watch?v=${ID}`,
        "https://www.youtube.com/watch?v=curto",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ<script>",
        "https://youtu.be/",
        "https://www.youtube.com/",
        `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`,
    ])("recusa %j", (url) => {
        expect(extractYoutubeId(url)).toBeNull();
    });
});

describe("vídeo do YouTube — validateVideoUrl", () => {
    it("campo vazio é válido, porque o vídeo é opcional", () => {
        expect(validateVideoUrl("")).toBeUndefined();
        expect(validateVideoUrl("   ")).toBeUndefined();
    });

    it("link válido não tem erro", () => {
        expect(validateVideoUrl(`https://youtu.be/${ID}`)).toBeUndefined();
    });

    it("link inválido devolve a orientação em português", () => {
        expect(validateVideoUrl("https://vimeo.com/123")).toBe(VIDEO_URL_ERROR);
        expect(VIDEO_URL_ERROR).toBe(
            "Cole um link de vídeo do YouTube, como https://www.youtube.com/watch?v=…",
        );
    });
});

describe("vídeo do YouTube — youtubeEmbedUrl", () => {
    it("monta o endereço de incorporação sem cookies de rastreio", () => {
        expect(youtubeEmbedUrl(ID)).toBe(
            `https://www.youtube-nocookie.com/embed/${ID}`,
        );
    });

    it("recusa id fora do formato, para nunca montar um endereço arbitrário", () => {
        expect(youtubeEmbedUrl("../../evil")).toBeNull();
        expect(youtubeEmbedUrl("")).toBeNull();
    });
});

describe("vídeo do YouTube — youtubeWatchUrl", () => {
    it("monta o link para assistir, usado ao reabrir o formulário", () => {
        expect(youtubeWatchUrl(ID)).toBe(
            `https://www.youtube.com/watch?v=${ID}`,
        );
    });

    it("sem id válido, devolve vazio", () => {
        expect(youtubeWatchUrl(null)).toBe("");
        expect(youtubeWatchUrl(undefined)).toBe("");
        expect(youtubeWatchUrl("../evil")).toBe("");
    });
});
