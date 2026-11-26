import { describe, expect, it } from "vitest";
import {
    emptyTrajectory,
    trajectoryBody,
    validateTrajectory,
} from "@/features/trajectory/trajectoryModel";
import type { TrajectoryDraft } from "@/features/trajectory/trajectoryModel";
import { VIDEO_URL_ERROR } from "@/features/video/youtube";

const LINK = "https://youtu.be/dQw4w9WgXcQ";

function draft(overrides: Partial<TrajectoryDraft> = {}): TrajectoryDraft {
    return {
        ...emptyTrajectory,
        story: "História da horta",
        activities: "Visitas",
        ...overrides,
    };
}

describe("trajetória — vídeo do YouTube no modelo", () => {
    it("começa sem vídeo", () => {
        expect(emptyTrajectory.videoUrl).toBe("");
        expect(emptyTrajectory.hadVideo).toBe(false);
    });

    it("link vazio ou válido não tem erro", () => {
        expect(validateTrajectory(draft()).videoUrl).toBeUndefined();
        expect(
            validateTrajectory(draft({ videoUrl: LINK })).videoUrl,
        ).toBeUndefined();
    });

    it("link inválido recebe a orientação", () => {
        expect(
            validateTrajectory(draft({ videoUrl: "https://vimeo.com/1" }))
                .videoUrl,
        ).toBe(VIDEO_URL_ERROR);
    });

    it("com link, envia o link sem espaços em volta", () => {
        expect(trajectoryBody(draft({ videoUrl: `  ${LINK} ` }))).toMatchObject(
            { videoUrl: LINK },
        );
    });

    it("sem link e sem vídeo salvo, não envia o campo (o cadastro não muda)", () => {
        expect(trajectoryBody(draft())).not.toHaveProperty("videoUrl");
    });

    it("apagar o link de um vídeo já salvo envia null, para removê-lo", () => {
        expect(
            trajectoryBody(draft({ videoUrl: "  ", hadVideo: true })),
        ).toMatchObject({ videoUrl: null });
    });
});
