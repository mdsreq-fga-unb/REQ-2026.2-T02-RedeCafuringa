import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderAdminApp } from "../fixtures/renderAdminApp";
import {
    admin,
    consumer,
    jsonResponse,
    producer,
    userPage,
} from "../fixtures/adminUsers";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
vi.mock("@/features/auth/authService", () => ({
    login: async () => ({
        token: "admin-session-token",
        user: { id: admin.id, name: "Administrador", role: "admin" },
    }),
}));

const fetchMock = vi.fn<typeof fetch>();
let deleted: string[] = [];
let deleteResponse: () => Response = () => new Response(null, { status: 204 });

const path = (input: RequestInfo | URL) =>
    new URL(String(input), window.location.origin);

beforeEach(() => {
    localStorage.clear();
    deleted = [];
    deleteResponse = () => new Response(null, { status: 204 });
    fetchMock.mockReset().mockImplementation(async (input, init) => {
        const url = path(input);
        const id = url.pathname.split("/users/")[1];
        if (init?.method === "DELETE") {
            const response = deleteResponse();
            if (response.status === 204) deleted.push(id);
            return response;
        }
        if (id) {
            const user = [admin, producer, consumer].find(
                (item) => item.id === id && !deleted.includes(id),
            );
            return user
                ? jsonResponse(user)
                : jsonResponse({ message: "Usuário não encontrado" }, 404);
        }
        const itens = userPage.itens.filter((u) => !deleted.includes(u.id));
        return jsonResponse({ ...userPage, itens, total: itens.length });
    });
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

const deleteCalls = () =>
    fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE");

async function openDetail(id = consumer.id) {
    await renderAdminApp(`#/admin/usuarios/${id}`);
    return screen.findByRole("button", { name: "Excluir conta" });
}

describe("excluir usuário pelo painel do administrador", () => {
    it("CA01, CA02, CA03: o botão abre a confirmação identificando a conta", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail());

        const dialog = screen.getByRole("alertdialog", {
            name: `Excluir a conta de ${consumer.nome}?`,
        });
        expect(within(dialog).getByText(/Consumidor/)).toBeTruthy();
        expect(within(dialog).getByText(/não pode ser desfeita/i)).toBeTruthy();
        expect(document.activeElement).toBe(
            within(dialog).getByRole("button", { name: "Cancelar" }),
        );
    });

    it("CA02: produtor é identificado pela iniciativa e pelo responsável", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail(producer.id));
        expect(
            screen.getByRole("alertdialog", {
                name: `Excluir a conta de ${producer.nomeIniciativa} (${producer.nome})?`,
            }),
        ).toBeTruthy();
    });

    it("CA05: cancelar fecha a confirmação, mantém a conta e devolve o foco", async () => {
        const user = userEvent.setup();
        const trigger = await openDetail();
        await user.click(trigger);

        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(deleteCalls()).toHaveLength(0);
        expect(document.activeElement).toBe(trigger);
        expect(
            screen.getByRole("heading", { name: consumer.nome }),
        ).toBeTruthy();
    });

    it("CA05: Esc também cancela", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail());
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(deleteCalls()).toHaveLength(0);
    });

    it("RN04: cada motivo explica se a pessoa poderá voltar", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail());
        expect(
            screen
                .getByRole("radio", { name: /Inatividade/ })
                .getAttribute("aria-describedby"),
        ).toBeTruthy();
        expect(
            screen.getByText(/^A pessoa poderá se cadastrar de novo/),
        ).toBeTruthy();
        expect(
            screen.getByText(/^A pessoa não poderá se cadastrar de novo/),
        ).toBeTruthy();
    });

    it("RN04: exige o motivo antes de excluir", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail());

        await user.click(
            screen.getByRole("button", { name: "Excluir definitivamente" }),
        );

        expect(screen.getByText("Escolha o motivo da exclusão.")).toBeTruthy();
        expect(deleteCalls()).toHaveLength(0);
        expect(document.activeElement).toBe(
            screen.getByRole("radio", { name: "Inatividade" }),
        );
    });

    it("CA04, CA08: confirma com motivo, informa o sucesso e a conta some da lista", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail());
        await user.click(screen.getByRole("radio", { name: "Inatividade" }));
        await user.click(
            screen.getByRole("button", { name: "Excluir definitivamente" }),
        );

        const [[input, init]] = deleteCalls();
        const url = path(input);
        expect(url.pathname).toBe(`/api/v1/users/${consumer.id}`);
        expect(url.searchParams.get("motivo")).toBe("INATIVIDADE");
        expect((init?.headers as Record<string, string>).Authorization).toBe(
            "Bearer admin-session-token",
        );
        await waitFor(() =>
            expect(window.location.hash).toBe("#/admin/usuarios"),
        );
        expect(
            (await screen.findByText(/excluída com sucesso/)).textContent,
        ).toBe(`A conta de ${consumer.nome} foi excluída com sucesso.`);
        await screen.findByRole("heading", { name: producer.nome });
        expect(
            screen.queryByRole("heading", { name: consumer.nome }),
        ).toBeNull();
        // RNF11: o nome da conta não vai para a URL.
        expect(window.location.href).not.toContain("Maria");
    });

    it("CA07: conta que já não existe informa que não foi possível excluir", async () => {
        deleteResponse = () =>
            jsonResponse(
                { message: "Conta não encontrada ou já excluída" },
                404,
            );
        const user = userEvent.setup();
        await user.click(await openDetail());
        await user.click(screen.getByRole("radio", { name: /Banimento/ }));
        await user.click(
            screen.getByRole("button", { name: "Excluir definitivamente" }),
        );

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Não foi possível excluir: a conta não existe mais ou já foi excluída.",
        );
        expect(screen.getByRole("alertdialog")).toBeTruthy();
    });

    it("CA07: recusa do servidor (409) aparece com a mensagem dele", async () => {
        deleteResponse = () =>
            jsonResponse(
                {
                    message:
                        "A conta administrativa inicial não pode ser excluída",
                },
                409,
            );
        const user = userEvent.setup();
        await user.click(await openDetail(producer.id));
        await user.click(screen.getByRole("radio", { name: /Banimento/ }));
        await user.click(
            screen.getByRole("button", { name: "Excluir definitivamente" }),
        );

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Não foi possível excluir: A conta administrativa inicial não pode ser excluída",
        );
    });

    it("RNF03: falha de conexão é tratada como falha do sistema, sem fechar a confirmação", async () => {
        deleteResponse = () => {
            throw new TypeError("Failed to fetch");
        };
        const user = userEvent.setup();
        await user.click(await openDetail());
        await user.click(screen.getByRole("radio", { name: /Banimento/ }));
        await user.click(
            screen.getByRole("button", { name: "Excluir definitivamente" }),
        );

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /conexão/i,
        );
        expect(
            (
                screen.getByRole("radio", {
                    name: /Banimento/,
                }) as HTMLInputElement
            ).checked,
        ).toBe(true);
    });

    it("a própria conta não oferece exclusão", async () => {
        await renderAdminApp(`#/admin/usuarios/${admin.id}`);
        await screen.findByRole("heading", { name: admin.nome, level: 2 });
        expect(
            screen.queryByRole("button", { name: "Excluir conta" }),
        ).toBeNull();
        expect(
            screen.getByText("Você não pode excluir a sua própria conta."),
        ).toBeTruthy();
    });

    it("RNF04: a confirmação não tem violações WCAG A/AA detectáveis", async () => {
        const user = userEvent.setup();
        await user.click(await openDetail());
        const result = await axe.run(screen.getByRole("alertdialog"), {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
            rules: { "color-contrast": { enabled: false } },
        });
        expect(result.violations.map((item) => item.id)).toEqual([]);
    });
});
