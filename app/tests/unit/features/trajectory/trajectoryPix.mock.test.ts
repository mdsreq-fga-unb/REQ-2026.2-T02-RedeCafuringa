import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getOwnTrajectory,
    getPublicTrajectory,
    saveTrajectory,
} from "@/features/trajectory/trajectoryService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

afterEach(() => localStorage.clear());

const pix = {
    tipo: "cpf" as const,
    chave: "52998224725",
    nomeRecebedor: "Maria da Silva",
    publico: true,
};

describe("trajetória — Pix na demonstração", () => {
    it("guarda o Pix para a produtora e nunca o mostra no perfil público", async () => {
        localStorage.setItem("cafuringa-token", "mock-token-2");

        const saved = await saveTrajectory({
            trajetoria: "História da horta",
            pix,
        });

        expect(saved.pix).toMatchObject(pix);
        expect((await getOwnTrajectory()).pix).toMatchObject(pix);
        expect(JSON.stringify(await getPublicTrajectory("2"))).not.toContain(
            "52998224725",
        );
    });

    it("sem o campo, mantém o Pix; com null, remove", async () => {
        localStorage.setItem("cafuringa-token", "mock-token-2");
        await saveTrajectory({ trajetoria: "História", pix });

        await saveTrajectory({ trajetoria: "História revista" });
        expect((await getOwnTrajectory()).pix).toMatchObject(pix);

        await saveTrajectory({ trajetoria: "História revista", pix: null });
        expect(await getOwnTrajectory()).not.toHaveProperty("pix");
    });
});
