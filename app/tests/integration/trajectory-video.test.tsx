import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VIDEO_URL_ERROR } from "@/features/video/youtube";
import {
    callsTo,
    fillTrajectory,
    json,
    mockTrajectoryApi,
    openEditor,
    ownPath,
    ownTrajectory,
    seedSession,
} from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const ID = "dQw4w9WgXcQ";
const LINK = `https://youtu.be/${ID}`;

beforeEach(() => {
    // jsdom não implementa a abertura e o fechamento nativos de dialog.
    Object.defineProperties(HTMLDialogElement.prototype, {
        showModal: {
            configurable: true,
            value(this: HTMLDialogElement) {
                this.open = true;
            },
        },
        close: {
            configurable: true,
            value(this: HTMLDialogElement) {
                this.open = false;
            },
        },
    });
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

const videoField = () =>
    screen.getByRole("textbox", {
        name: "Vídeo do YouTube (opcional)",
    }) as HTMLInputElement;

const sentBody = (api: ReturnType<typeof mockTrajectoryApi>) =>
    JSON.parse(String(callsTo(api, ownPath, "PUT")[0][1]?.body));

describe("trajetória — vídeo do YouTube", () => {
    it("com um link válido, salva o link junto com a trajetória", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory();

        fireEvent.change(videoField(), { target: { value: LINK } });
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        expect(sentBody(api).videoUrl).toBe(LINK);
    });

    it("sem link e sem vídeo salvo, não envia o campo", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory();

        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        expect(sentBody(api)).not.toHaveProperty("videoUrl");
    });

    it("com um link inválido, orienta, foca o campo e não salva", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory();

        fireEvent.change(videoField(), {
            target: { value: "https://vimeo.com/1" },
        });
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        expect((await screen.findByRole("alert")).textContent).toBe(
            VIDEO_URL_ERROR,
        );
        await waitFor(() => expect(document.activeElement).toBe(videoField()));
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
    });

    it("ao reabrir, mostra o link do vídeo salvo e a prévia", async () => {
        seedSession();
        mockTrajectoryApi({
            getOwn: () => json({ ...ownTrajectory, videoId: ID }),
        });

        await openEditor();

        expect(videoField().value).toBe(
            `https://www.youtube.com/watch?v=${ID}`,
        );
        expect(
            screen
                .getByTitle("Vídeo: prévia do link informado")
                .getAttribute("src"),
        ).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
    });

    it("apagar o link de um vídeo salvo envia null para removê-lo", async () => {
        seedSession();
        const api = mockTrajectoryApi({
            getOwn: () => json({ ...ownTrajectory, videoId: ID }),
        });
        const { user } = await openEditor();

        fireEvent.change(videoField(), { target: { value: "" } });
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        expect(sentBody(api).videoUrl).toBeNull();
    });
});

describe("trajetória — descrição do motivo do vídeo", () => {
    it("explica para que serve o vídeo", async () => {
        seedSession();
        mockTrajectoryApi();

        await openEditor();

        expect(
            screen.getByText(
                "Conte sua história em vídeo: a família, a propriedade e o dia a dia. O vídeo aparece no seu perfil público.",
            ),
        ).toBeTruthy();
    });
});
