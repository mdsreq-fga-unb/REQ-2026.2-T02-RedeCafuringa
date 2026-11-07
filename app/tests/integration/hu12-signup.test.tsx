import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    activities,
    callsTo,
    continueSignup,
    fillTrajectory,
    json,
    mockTrajectoryApi,
    ownPath,
    selectPhoto,
    signupRoute,
    story,
    token,
} from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

beforeEach(() => {
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

describe("HU12 — etapa de trajetória após os dados do produtor (TDD RED)", () => {
    it("CA03/protótipo: exige selecionar uma foto antes de concluir o cadastro", async () => {
        const api = mockTrajectoryApi();
        const user = await continueSignup();
        fillTrajectory();
        expect(screen.getByLabelText(/^Adicionar foto/i)).toHaveProperty(
            "required",
            true,
        );
        const form = screen
            .getByLabelText(/^Minha Trajetória/i)
            .closest("form");
        expect(form).not.toBeNull();
        fireEvent.submit(form!);
        expect(
            screen
                .getAllByRole("alert")
                .map((item) => item.textContent)
                .join(" "),
        ).toMatch(/foto/i);
        expect(callsTo(api, "/api/v1/users/producers", "POST")).toHaveLength(0);
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
        await selectPhoto(user);
    });
    it("Continuar abre Conte sua história sem concluir o cadastro nem criar a conta antecipadamente", async () => {
        const api = mockTrajectoryApi();
        await continueSignup();
        expect(window.location.hash).toBe(signupRoute);
        expect(
            screen.queryByRole("heading", {
                name: "Você já faz parte da rede",
            }),
        ).toBeNull();
        expect(callsTo(api, "/api/v1/users/producers", "POST")).toHaveLength(0);
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
        expect(
            screen.getByRole("button", { name: "Criar conta" }),
        ).toBeTruthy();
    });

    it("Voltar recupera os dados pessoais e permite retornar à trajetória sem perder o rascunho", async () => {
        mockTrajectoryApi();
        const user = await continueSignup();
        fillTrajectory();
        await user.click(screen.getByRole("button", { name: "Voltar" }));
        expect(
            await screen.findByLabelText("Nome da iniciativa"),
        ).toHaveProperty("value", "Horta da Maria");
        expect(screen.getByLabelText("E-mail")).toHaveProperty(
            "value",
            "maria@example.com",
        );
        expect(screen.getByLabelText("Localidade")).toHaveProperty(
            "value",
            "Chácara 12, Núcleo Rural",
        );
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        expect(
            await screen.findByLabelText(/^Minha Trajetória/i),
        ).toHaveProperty("value", story);
        expect(screen.getByLabelText(/^Produção/i)).toHaveProperty(
            "value",
            activities,
        );
    });

    it("Criar conta registra o produtor, autentica e salva a trajetória com o token do novo titular", async () => {
        const api = mockTrajectoryApi();
        const user = await continueSignup();
        fillTrajectory();
        await selectPhoto(user);
        await user.click(screen.getByRole("button", { name: "Criar conta" }));
        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        const registration = callsTo(api, "/api/v1/users/producers", "POST");
        expect(registration).toHaveLength(1);
        expect(JSON.parse(String(registration[0][1]?.body))).toMatchObject({
            nomeIniciativa: "Horta da Maria",
            email: "maria@example.com",
        });
        expect(callsTo(api, "/api/v1/auth/login", "POST")).toHaveLength(1);
        const [, init] = callsTo(api, ownPath, "PUT")[0];
        expect(init?.headers).toMatchObject({
            Authorization: `Bearer ${token}`,
        });
        expect(JSON.parse(String(init?.body))).toMatchObject({
            trajetoria: story,
            atividades: activities,
        });
        expect(JSON.parse(String(init?.body))).not.toHaveProperty("cpf");
        expect(JSON.parse(String(init?.body))).not.toHaveProperty("senha");
        expect(
            await screen.findByRole("heading", {
                name: "Você já faz parte da rede",
            }),
        ).toBeTruthy();
    });

    it("CA07: se a conta foi criada mas a trajetória falhou, preserva o rascunho e repete somente o PUT", async () => {
        let attempts = 0;
        const api = mockTrajectoryApi({
            save: () => {
                if (++attempts === 1) throw new TypeError("Failed to fetch");
                return json({
                    trajetoria: story,
                    atividades: activities,
                    telefonePublico: false,
                });
            },
        });
        const user = await continueSignup();
        fillTrajectory();
        await selectPhoto(user);
        await user.click(screen.getByRole("button", { name: "Criar conta" }));
        expect(await screen.findByRole("alert")).toHaveProperty(
            "textContent",
            expect.stringMatching(/não.*(conclu|salv|registr)|falha|conexão/i),
        );
        expect(screen.getByLabelText(/^Minha Trajetória/i)).toHaveProperty(
            "value",
            story,
        );
        expect(
            screen.queryByRole("heading", {
                name: "Você já faz parte da rede",
            }),
        ).toBeNull();
        await user.click(
            screen.getByRole("button", {
                name: /tentar novamente|criar conta/i,
            }),
        );
        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(2),
        );
        expect(callsTo(api, "/api/v1/users/producers", "POST")).toHaveLength(1);
        expect(
            callsTo(api, ownPath, "PUT").map(([, init]) =>
                JSON.parse(String(init?.body)),
            ),
        ).toEqual([
            expect.objectContaining({ trajetoria: story }),
            expect.objectContaining({ trajetoria: story }),
        ]);
    });

    it("não guarda senha, CPF ou foto em localStorage/sessionStorage para transportar as etapas", async () => {
        mockTrajectoryApi();
        const user = await continueSignup();
        fillTrajectory();
        const file = await selectPhoto(user);
        fireEvent.change(screen.getByLabelText(/^Número de Contato/i), {
            target: { value: "61988887777" },
        });
        for (const storage of [localStorage, sessionStorage]) {
            const saved = Object.values(storage).join(" ");
            expect(saved).not.toMatch(
                /SenhaSegura123|529[.\s-]*982[.\s-]*247[.\s-]*25|data:image/,
            );
        }
        expect(
            (screen.getByLabelText(/^Adicionar foto/i) as HTMLInputElement)
                .files?.[0],
        ).toBe(file);
    });
});
