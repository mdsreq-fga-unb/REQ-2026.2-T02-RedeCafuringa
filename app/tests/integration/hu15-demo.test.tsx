import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fillProduct, openProduct, session } from "../fixtures/hu15";

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

describe("HU15 — modo de testes local", () => {
    it("simula cadastro, confirmação e visualização com foto sem acessar a API", async () => {
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        session();
        const { user } = await openProduct();
        expect(
            screen.queryByRole("option", { name: "Selecione uma categoria" }),
        ).toBeNull();
        await fillProduct(user);
        await user.click(
            screen.getByRole("button", { name: "Adicionar produto" }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Sua oferta está na rede",
            }),
        ).toBeTruthy();
        await user.click(screen.getByRole("button", { name: "Visualizar" }));
        expect(
            await screen.findByRole("heading", { name: "Cesta da estação" }),
        ).toBeTruthy();
        expect(screen.getByText(/Produtor: Horta da Joana/)).toBeTruthy();
        expect(
            screen
                .getByRole("img", { name: "Cesta da estação" })
                .getAttribute("src"),
        ).toMatch(/^data:image\/png;base64,/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
