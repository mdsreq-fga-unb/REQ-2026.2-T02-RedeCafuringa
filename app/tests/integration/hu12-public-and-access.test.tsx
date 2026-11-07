import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    activities,
    callsTo,
    editorRoute,
    fotoUrl,
    json,
    mockTrajectoryApi,
    ownPath,
    publicPath,
    publicRoute,
    publicTrajectory,
    seedSession,
    story,
} from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

describe("HU12 — CA05/CA06 e privacidade do perfil", () => {
    it.each([null, "consumer", "admin"] as const)(
        "perfil %s não pode abrir o editor nem consultar a trajetória privada",
        async (role) => {
            if (role) seedSession(role);
            const api = mockTrajectoryApi();
            window.location.hash = editorRoute;
            render(<App />);
            await waitFor(() =>
                expect(window.location.hash).not.toBe(editorRoute),
            );
            expect(
                screen.queryByRole("heading", { name: "Conte sua história" }),
            ).toBeNull();
            expect(callsTo(api, ownPath)).toHaveLength(0);
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
        },
    );

    it.each([null, "consumer"] as const)(
        "CA05: perfil %s consulta os textos publicados sem Bearer na rota pública",
        async (role) => {
            if (role) seedSession(role);
            const api = mockTrajectoryApi();
            window.location.hash = publicRoute;
            render(<App />);
            expect(
                await screen.findByRole("heading", { name: "Horta da Maria" }),
            ).toBeTruthy();
            expect(screen.getByText(story)).toBeTruthy();
            expect(screen.getByText(activities)).toBeTruthy();
            expect(callsTo(api, publicPath)).toHaveLength(1);
            const [, init] = callsTo(api, publicPath)[0];
            expect(new Headers(init?.headers).get("Authorization")).toBeNull();
            expect(callsTo(api, ownPath)).toHaveLength(0);
            expect(
                screen.queryByRole("button", {
                    name: /salvar|editar trajetória/i,
                }),
            ).toBeNull();
        },
    );

    it("RF12: exibe a foto do produtor com texto alternativo quando houver", async () => {
        mockTrajectoryApi({ publicData: { ...publicTrajectory, fotoUrl } });
        window.location.hash = publicRoute;
        render(<App />);
        const photo = await screen.findByRole("img", {
            name: "Foto de Horta da Maria",
        });
        expect(photo.getAttribute("src")).toBe(`/api/v1${fotoUrl}`);
    });

    it("RF12: sem foto, não exibe imagem quebrada", async () => {
        mockTrajectoryApi();
        window.location.hash = publicRoute;
        render(<App />);
        await screen.findByRole("heading", { name: "Horta da Maria" });
        expect(screen.queryByRole("img", { name: /foto de/i })).toBeNull();
    });

    it("RN07/RNF11: telefone ausente na resposta pública não é recuperado dos dados locais", async () => {
        seedSession();
        localStorage.setItem(
            "cafuringa-contact",
            JSON.stringify({
                whatsappNumber: "5561999999999",
                authorized: true,
            }),
        );
        mockTrajectoryApi();
        window.location.hash = publicRoute;
        render(<App />);
        expect(await screen.findByText(story)).toBeTruthy();
        expect(document.body.textContent).not.toMatch(
            /61999999999|61\s*99999[-\s]*9999/,
        );
        expect(
            screen.queryByRole("button", { name: /whatsapp|contato|falar/i }),
        ).toBeNull();
        expect(
            screen.queryByRole("link", { name: /whatsapp|contato|falar/i }),
        ).toBeNull();
    });

    it("RN07: mostra o contato autorizado devolvido pela consulta pública", async () => {
        mockTrajectoryApi({
            publicData: { ...publicTrajectory, telefone: "61988887777" },
        });
        window.location.hash = publicRoute;
        render(<App />);
        expect(await screen.findByText(story)).toBeTruthy();
        expect(document.body.textContent?.replace(/\D/g, "")).toContain(
            "61988887777",
        );
    });

    it("RNF11: renderiza somente os campos públicos mesmo se a resposta contiver dados privados inesperados", async () => {
        mockTrajectoryApi({
            getPublic: () =>
                json({
                    ...publicTrajectory,
                    email: "privado@example.com",
                    cpf: "52998224725",
                    cnpj: "11222333000181",
                    nomeResponsavel: "Responsável privado",
                    senhaHash: "hash-privado",
                }),
        });
        window.location.hash = publicRoute;
        render(<App />);
        expect(await screen.findByText(story)).toBeTruthy();
        expect(document.body.textContent).not.toMatch(
            /privado@example.com|52998224725|11222333000181|Responsável privado|hash-privado/,
        );
    });

    it("CA05/RNF11: exibe textos como texto, sem interpretar HTML", async () => {
        const html = '<img src=x onerror="alert(1)">Nossa história';
        mockTrajectoryApi({
            publicData: { ...publicTrajectory, trajetoria: html },
        });
        window.location.hash = publicRoute;
        const { container } = render(<App />);
        expect(await screen.findByText(html)).toBeTruthy();
        expect(container.querySelector("[onerror]")).toBeNull();
    });

    it("CA05: perfil ainda não publicado (404) informa indisponibilidade sem mostrar a história fictícia de Dona Maria", async () => {
        mockTrajectoryApi({
            getPublic: () =>
                json(
                    { statusCode: 404, message: "Perfil não encontrado" },
                    404,
                ),
        });
        window.location.hash = publicRoute;
        render(<App />);
        expect(
            await screen.findByText(
                /perfil.*(indisponível|não encontrado)|trajetória.*(indisponível|não encontrad)/i,
            ),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", { name: "Dona Maria" }),
        ).toBeNull();
        expect(screen.queryByText(story)).toBeNull();
    });
});
