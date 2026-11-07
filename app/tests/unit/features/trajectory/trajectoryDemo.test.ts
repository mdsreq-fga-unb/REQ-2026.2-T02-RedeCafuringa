import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getOwnTrajectory,
    getPublicTrajectory,
    saveTrajectory,
} from "@/features/trajectory/trajectoryService";
vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

afterEach(() => localStorage.clear());

describe("HU12 — demonstração separada por titular", () => {
    it("não consulta dados privados sem sessão", async () => {
        await expect(getOwnTrajectory()).rejects.toMatchObject({ status: 401 });
    });
    it("perfil sem trajetória publicada permanece indisponível", async () => {
        await expect(getPublicTrajectory("inexistente")).rejects.toMatchObject({
            status: 404,
        });
    });
    it("isola o rascunho por conta e só divulga o telefone com autorização", async () => {
        localStorage.setItem("cafuringa-token", "mock-token-2");
        await saveTrajectory({
            trajetoria: "História da horta",
            atividades: "Visitas",
            telefone: "61999999999",
            telefonePublico: false,
        });
        expect(await getPublicTrajectory("2")).toMatchObject({
            trajetoria: "História da horta",
        });
        expect(await getPublicTrajectory("2")).not.toHaveProperty("telefone");
        expect(await getPublicTrajectory("2")).not.toHaveProperty("email");
        localStorage.setItem("cafuringa-token", "mock-token-4");
        expect(await getOwnTrajectory()).toEqual({ telefonePublico: false });
        localStorage.setItem("cafuringa-token", "mock-token-2");
        await saveTrajectory({
            trajetoria: "História da horta",
            telefonePublico: true,
        });
        expect(await getPublicTrajectory("2")).toHaveProperty(
            "telefone",
            "61999999999",
        );
        await saveTrajectory({
            trajetoria: "História da horta",
            telefone: null,
        });
        expect(await getPublicTrajectory("2")).not.toHaveProperty("telefone");
        expect(await getOwnTrajectory()).toMatchObject({
            telefonePublico: false,
        });
    });
});
