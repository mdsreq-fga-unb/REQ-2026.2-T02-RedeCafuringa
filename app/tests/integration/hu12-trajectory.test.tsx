import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    activities,
    callsTo,
    editorRoute,
    fillTrajectory,
    json,
    mockTrajectoryApi,
    openEditor,
    ownPath,
    ownTrajectory,
    seedSession,
    selectPhoto,
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

describe("HU12 — acesso, formulário e contrato HTTP (TDD RED)", () => {
    it("CA01: a conta do produtor oferece Minha trajetória e abre o formulário", async () => {
        seedSession();
        mockTrajectoryApi();
        window.location.hash = "#/conta";
        render(<App />);
        await userEvent
            .setup()
            .click(screen.getByRole("button", { name: /minha trajetória/i }));
        expect(
            await screen.findByRole("heading", { name: "Conte sua história" }),
        ).toBeTruthy();
        expect(window.location.hash).toBe(editorRoute);
    });

    it("CA01/CA02: consulta os dados do titular com Bearer e preenche os campos", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        await openEditor();
        await waitFor(() =>
            expect(screen.getByLabelText(/^Minha Trajetória/i)).toHaveProperty(
                "value",
                story,
            ),
        );
        expect(screen.getByLabelText(/^Produção/i)).toHaveProperty(
            "value",
            activities,
        );
        expect(
            (
                screen.getByLabelText(/^Número de Contato/i) as HTMLInputElement
            ).value.replace(/\D/g, ""),
        ).toBe("61999999999");
        expect(callsTo(api, ownPath)[0][1]?.headers).toMatchObject({
            Authorization: `Bearer ${token}`,
        });
    });

    it("CA02/RNF11: apresenta o aviso de perfil público e dados sensíveis do protótipo", async () => {
        seedSession();
        mockTrajectoryApi();
        await openEditor();
        expect(
            screen.getByText(
                /A trajetória será exibida no perfil público.*Não inclua documentos ou dados pessoais sensíveis/i,
            ),
        ).toBeTruthy();
    });

    it("CA03: história e atividades são obrigatórias na interface; contato é opcional", async () => {
        seedSession();
        mockTrajectoryApi({ own: { telefonePublico: false } });
        await openEditor();
        expect(screen.getByLabelText(/^Minha Trajetória/i)).toHaveProperty(
            "required",
            true,
        );
        expect(screen.getByLabelText(/^Produção/i)).toHaveProperty(
            "required",
            true,
        );
        expect(screen.getByLabelText(/^Número de Contato/i)).toHaveProperty(
            "required",
            false,
        );
    });

    it.each([
        ["", activities],
        ["   ", activities],
        ["\u200b\u200b", activities],
        [story, ""],
        [story, "   "],
        ["a".repeat(2001), activities],
        [story, "a".repeat(2001)],
    ])(
        "CA03: impede envio com trajetória/atividades inválidas (caso %#)",
        async (text, work) => {
            seedSession();
            const api = mockTrajectoryApi();
            const { user } = await openEditor();
            fillTrajectory(text, work);
            const form = screen
                .getByLabelText(/^Minha Trajetória/i)
                .closest("form");
            expect(form).not.toBeNull();
            fireEvent.submit(form!);
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
            expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
            await user.tab();
        },
    );

    it("CA03: aceita o limite de 2000 caracteres definido pelo backend", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory("a".repeat(2000), "b".repeat(2000));
        await user.click(screen.getByRole("button", { name: /salvar/i }));
        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
    });

    it("CA04: salva por PUT /producers/me/trajectory sem enviar identificador de outro produtor", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory("Nova história da família.");
        fireEvent.change(screen.getByLabelText(/^Número de Contato/i), {
            target: { value: "(61) 98888-7777" },
        });
        await user.click(screen.getByRole("button", { name: /salvar/i }));
        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        const [, init] = callsTo(api, ownPath, "PUT")[0];
        expect(init?.headers).toMatchObject({
            Authorization: `Bearer ${token}`,
        });
        expect(JSON.parse(String(init?.body))).toEqual({
            trajetoria: "Nova história da família.",
            atividades: activities,
            telefone: "61988887777",
            telefonePublico: false,
        });
        expect(await screen.findByRole("status")).toHaveProperty(
            "textContent",
            expect.stringMatching(/salv|registrad|sucesso/i),
        );
    });

    it("RN07: só divulga o contato quando o titular autoriza explicitamente", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        const consent = screen.getByRole("checkbox", {
            name: /autorizo.*(telefone|número|contato)/i,
        });
        expect(consent).toHaveProperty("checked", false);
        await user.click(consent);
        await user.click(screen.getByRole("button", { name: /salvar/i }));
        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        expect(
            JSON.parse(String(callsTo(api, ownPath, "PUT")[0][1]?.body)),
        ).toMatchObject({ telefonePublico: true });
    });

    it("CA03: rejeita contato inválido sem enviar o formulário", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fireEvent.change(screen.getByLabelText(/^Número de Contato/i), {
            target: { value: "123" },
        });
        await user.click(screen.getByRole("button", { name: /salvar/i }));
        expect(
            screen
                .getAllByRole("alert")
                .map((item) => item.textContent)
                .join(" "),
        ).toMatch(/telefone|contato|DDD/i);
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
    });

    it("CA07: preserva os textos em falha de conexão e permite reenviar o mesmo conteúdo", async () => {
        seedSession();
        let attempts = 0;
        const api = mockTrajectoryApi({
            save: () => {
                if (++attempts === 1) throw new TypeError("Failed to fetch");
                return json(ownTrajectory);
            },
        });
        const { user } = await openEditor();
        fillTrajectory();
        await user.click(screen.getByRole("button", { name: /salvar/i }));
        expect(await screen.findByRole("alert")).toHaveProperty(
            "textContent",
            expect.stringMatching(/conexão|falha|não.*salv/i),
        );
        expect(screen.getByLabelText(/^Minha Trajetória/i)).toHaveProperty(
            "value",
            story,
        );
        expect(screen.getByLabelText(/^Produção/i)).toHaveProperty(
            "value",
            activities,
        );
        await user.click(
            screen.getByRole("button", { name: /salvar|tentar novamente/i }),
        );
        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(2),
        );
        const bodies = callsTo(api, ownPath, "PUT").map(
            ([, init]) => init?.body,
        );
        expect(bodies[0]).toBe(bodies[1]);
    });

    it("CA07: falha ao carregar não permite sobrescrever a trajetória com um formulário vazio", async () => {
        seedSession();
        const api = mockTrajectoryApi({
            getOwn: () => {
                throw new TypeError("Failed to fetch");
            },
        });
        await openEditor();
        expect(await screen.findByRole("alert")).toHaveProperty(
            "textContent",
            expect.stringMatching(/carreg|conexão|falha/i),
        );
        expect(screen.getByRole("button", { name: /salvar/i })).toHaveProperty(
            "disabled",
            true,
        );
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
    });

    it("CA04: bloqueia duplo envio enquanto o salvamento está pendente", async () => {
        seedSession();
        let resolve!: (value: Response) => void;
        const pending = new Promise<Response>((done) => {
            resolve = done;
        });
        const api = mockTrajectoryApi({ save: () => pending });
        const { user } = await openEditor();
        fillTrajectory();
        await user.dblClick(screen.getByRole("button", { name: /salvar/i }));
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(1);
        expect(
            screen.getByRole("button", { name: /salvando/i }),
        ).toHaveProperty("disabled", true);
        await act(async () => resolve(json(ownTrajectory)));
    });

    it.each([400, 401, 403, 500])(
        "CA03/CA06/CA07: erro HTTP %i não mostra sucesso nem apaga o rascunho",
        async (status) => {
            seedSession();
            mockTrajectoryApi({
                save: () =>
                    json(
                        {
                            statusCode: status,
                            message: "Registro não concluído.",
                        },
                        status,
                    ),
            });
            const { user } = await openEditor();
            fillTrajectory();
            await user.click(screen.getByRole("button", { name: /salvar/i }));
            expect(await screen.findByRole("alert")).toBeTruthy();
            expect(screen.getByLabelText(/^Minha Trajetória/i)).toHaveProperty(
                "value",
                story,
            );
            expect(
                screen.queryByText(/trajetória salva com sucesso/i),
            ).toBeNull();
        },
    );

    it("protótipo: seleciona uma foto com nome acessível, sem inventar upload no contrato da trajetória", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        const file = await selectPhoto(user);
        expect(
            (screen.getByLabelText(/^Adicionar foto/i) as HTMLInputElement)
                .files?.[0],
        ).toBe(file);
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
    });

    it("RNF04: formulário sem violações automáticas WCAG A/AA", async () => {
        seedSession();
        mockTrajectoryApi();
        const { container } = await openEditor();
        await waitFor(() =>
            expect(screen.getByLabelText(/^Minha Trajetória/i)).toHaveProperty(
                "value",
                story,
            ),
        );
        const result = await axe.run(container, {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
            rules: { "color-contrast": { enabled: false } },
        });
        expect(result.violations.map((item) => item.id)).toEqual([]);
    });
});
