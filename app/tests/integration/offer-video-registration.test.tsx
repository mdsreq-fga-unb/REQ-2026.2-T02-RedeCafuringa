import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VIDEO_URL_ERROR } from "@/features/video/youtube";
import * as productFixture from "../fixtures/hu15";
import * as experienceFixture from "../fixtures/hu21";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const LINK = "https://youtu.be/dQw4w9WgXcQ";

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

const videoField = () =>
    screen.getByRole("textbox", {
        name: "Vídeo do YouTube (opcional)",
    }) as HTMLInputElement;

function typeVideo(value: string) {
    fireEvent.change(videoField(), { target: { value } });
}

describe("vídeo do YouTube no cadastro de produto", () => {
    it("o campo aparece e, vazio, o envio segue sem vídeo", async () => {
        productFixture.session();
        const api = productFixture.mockProductApi();
        const { user } = await productFixture.openProduct();
        await productFixture.fillProduct(user);

        expect(videoField().value).toBe("");
        productFixture.submit();

        await screen.findByRole("status");
        const body = productFixture.submissions(api)[0][1]!.body as FormData;
        expect(body.has("videoUrl")).toBe(false);
    });

    it("com um link válido, envia o link sem espaços em volta", async () => {
        productFixture.session();
        const api = productFixture.mockProductApi();
        const { user } = await productFixture.openProduct();
        await productFixture.fillProduct(user);

        typeVideo(`  ${LINK}  `);
        productFixture.submit();

        await screen.findByRole("status");
        const body = productFixture.submissions(api)[0][1]!.body as FormData;
        expect(body.get("videoUrl")).toBe(LINK);
    });

    it("com um link inválido, orienta, foca o campo e não envia", async () => {
        productFixture.session();
        const api = productFixture.mockProductApi();
        const { user } = await productFixture.openProduct();
        await productFixture.fillProduct(user);

        typeVideo("https://vimeo.com/123");
        productFixture.submit();

        expect((await screen.findByRole("alert")).textContent).toBe(
            VIDEO_URL_ERROR,
        );
        expect(document.activeElement).toBe(videoField());
        expect(videoField().getAttribute("aria-invalid")).toBe("true");
        expect(productFixture.submissions(api)).toHaveLength(0);
    });

    it("corrigir o link apaga a orientação", async () => {
        productFixture.session();
        productFixture.mockProductApi();
        const { user } = await productFixture.openProduct();
        await productFixture.fillProduct(user);
        typeVideo("https://vimeo.com/123");
        productFixture.submit();
        await screen.findByRole("alert");

        typeVideo(LINK);

        expect(screen.queryByText(VIDEO_URL_ERROR)).toBeNull();
        expect(videoField().getAttribute("aria-invalid")).toBeNull();
    });
});

describe("vídeo do YouTube no cadastro de experiência", () => {
    it("com um link válido, envia o link junto com a experiência", async () => {
        experienceFixture.session();
        const api = experienceFixture.mockExperienceApi();
        const { user } = await experienceFixture.openExperience();
        await experienceFixture.fillExperience(user);

        typeVideo(LINK);
        experienceFixture.submit();

        await screen.findByRole("status");
        const body = experienceFixture.submissions(api)[0][1]!.body as FormData;
        expect(body.get("videoUrl")).toBe(LINK);
    });

    it("vazio, envia sem vídeo", async () => {
        experienceFixture.session();
        const api = experienceFixture.mockExperienceApi();
        const { user } = await experienceFixture.openExperience();
        await experienceFixture.fillExperience(user);

        experienceFixture.submit();

        await screen.findByRole("status");
        const body = experienceFixture.submissions(api)[0][1]!.body as FormData;
        expect(body.has("videoUrl")).toBe(false);
    });

    it("com um link inválido, não envia", async () => {
        experienceFixture.session();
        const api = experienceFixture.mockExperienceApi();
        const { user } = await experienceFixture.openExperience();
        await experienceFixture.fillExperience(user);

        typeVideo("não é link");
        experienceFixture.submit();

        expect((await screen.findByRole("alert")).textContent).toBe(
            VIDEO_URL_ERROR,
        );
        expect(experienceFixture.submissions(api)).toHaveLength(0);
    });

    it("trocar a categoria preserva o link informado", async () => {
        experienceFixture.session();
        experienceFixture.mockExperienceApi();
        const { user } = await experienceFixture.openExperience();
        const f = await experienceFixture.fillExperience(user);
        typeVideo(LINK);

        await user.selectOptions(f.categoria, "Produtos");
        await user.selectOptions(
            experienceFixture.fields().categoria,
            "Experiência",
        );

        expect(videoField().value).toBe(LINK);
    });
});
