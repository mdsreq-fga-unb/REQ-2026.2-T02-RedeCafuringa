import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getOwnTrajectory,
    getPublicTrajectory,
    saveTrajectory,
} from "@/features/trajectory/trajectoryService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

afterEach(() => localStorage.clear());

const ID = "dQw4w9WgXcQ";

describe("trajetória — vídeo do YouTube na demonstração", () => {
    it("guarda só o id do vídeo e o mostra no perfil público", async () => {
        localStorage.setItem("cafuringa-token", "mock-token-2");

        const saved = await saveTrajectory({
            trajetoria: "História da horta",
            atividades: "Visitas",
            videoUrl: `https://www.youtube.com/watch?v=${ID}`,
        });

        expect(saved.videoId).toBe(ID);
        expect(await getOwnTrajectory()).toMatchObject({ videoId: ID });
        expect(await getPublicTrajectory("2")).toMatchObject({ videoId: ID });
    });

    it("sem o campo, mantém o vídeo salvo; com null, remove", async () => {
        localStorage.setItem("cafuringa-token", "mock-token-2");
        await saveTrajectory({
            trajetoria: "História",
            videoUrl: `https://youtu.be/${ID}`,
        });

        await saveTrajectory({ trajetoria: "História revista" });
        expect(await getOwnTrajectory()).toMatchObject({ videoId: ID });

        await saveTrajectory({
            trajetoria: "História revista",
            videoUrl: null,
        });
        expect((await getOwnTrajectory()).videoId).toBeUndefined();
        expect(await getPublicTrajectory("2")).not.toHaveProperty("videoId");
    });
});
