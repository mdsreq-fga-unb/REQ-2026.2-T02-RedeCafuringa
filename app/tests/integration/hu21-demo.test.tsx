import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    experience,
    fillExperience,
    openExperience,
    session,
} from "../fixtures/hu21";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

it("demonstra cadastro e visualização com fotos e responsável sem API", async () => {
    const api = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", api);
    session();
    const { user } = await openExperience();
    await fillExperience(user);
    await user.click(
        screen.getByRole("button", { name: "Adicionar experiência" }),
    );
    expect(
        await screen.findByRole("heading", { name: "Sua oferta está na rede" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(
        await screen.findByRole("heading", { name: experience.nome }),
    ).toBeTruthy();
    expect(screen.getByText(experience.local)).toBeTruthy();
    expect(screen.getByText(experience.duracao)).toBeTruthy();
    expect(screen.getByText(/Produtor: Horta da Joana/)).toBeTruthy();
    expect(
        screen.getByRole("img", { name: experience.nome }).getAttribute("src"),
    ).toMatch(/^data:image\/png;base64,/);
    expect(api).not.toHaveBeenCalled();
});
