import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { json, seedSession } from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

type Status = "pendente" | "aceita" | "recusada" | "cancelada";

const detail = (status: Status) => ({
    id: "b1",
    experienciaId: "e1",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    status,
    criadoEm: "2026-11-19T13:00:00.000Z",
    atualizadoEm: "2026-11-19T13:00:00.000Z",
    experiencia: {
        nome: "Sabores e caminhos do Cerrado",
        local: "Sítio Raízes",
        valorPorPessoa: 45,
        disponivel: true,
    },
    contraparte: { id: "p1", nome: "Sítio Raízes" },
});

/** API simulada com estado: o PATCH muda o que os GET seguintes devolvem. */
function api({ cancelFails = false } = {}) {
    let status: Status = "pendente";
    const fetchMock = vi.fn<typeof fetch>((input, init) => {
        const url = new URL(String(input), "http://localhost");
        const path = url.pathname;
        if (path === "/api/v1/bookings/b1/cancel" && init?.method === "PATCH") {
            if (cancelFails)
                return Promise.resolve(
                    json({ statusCode: 500, message: "Erro interno" }, 500),
                );
            status = "cancelada";
            // O PATCH devolve a solicitação sem experiência nem contraparte.
            const { id, experienciaId, data, horario, participantes } =
                detail(status);
            return Promise.resolve(
                json({
                    id,
                    experienciaId,
                    data,
                    horario,
                    participantes,
                    formaPagamento: "pix",
                    status,
                    criadoEm: "2026-11-19T13:00:00.000Z",
                }),
            );
        }
        if (path === "/api/v1/bookings/mine")
            return Promise.resolve(
                json({
                    itens: [detail(status)],
                    total: 1,
                    pagina: 1,
                    limite: 50,
                }),
            );
        if (path === "/api/v1/bookings/b1")
            return Promise.resolve(json(detail(status)));
        if (path.startsWith("/api/v1/bookings/"))
            return Promise.resolve(
                json(
                    { statusCode: 404, message: "Pré-reserva não encontrada" },
                    404,
                ),
            );
        if (path === "/api/v1/producers") return Promise.resolve(json([]));
        if (path.endsWith("/products") || path.endsWith("/experiences"))
            return Promise.resolve(
                json({ itens: [], total: 0, pagina: 1, limite: 20 }),
            );
        return Promise.resolve(json({ message: "não encontrado" }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

const cancelCalls = (fetchMock: ReturnType<typeof api>) =>
    fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH");

beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("HU46 — cancelar pré-reserva no app", () => {
    it("CA01 a CA03, CA06: do detalhe à confirmação, e a situação nova aparece na lista e no detalhe", async () => {
        const fetchMock = api();
        seedSession("consumer");
        window.location.hash = "#/reservas/b1";
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", { name: "Cancelar solicitação" }),
        );
        await waitFor(() =>
            expect(window.location.hash).toBe("#/reservas/b1/cancelar"),
        );
        await screen.findByRole("heading", {
            level: 1,
            name: "Cancelar solicitação?",
        });
        await user.click(
            screen.getByRole("button", { name: "Sim, cancelar solicitação" }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Solicitação cancelada",
            }),
        ).toBeTruthy();
        const [[, init]] = cancelCalls(fetchMock);
        expect(new Headers(init?.headers).get("Authorization")).toMatch(
            /^Bearer /,
        );

        await user.click(
            screen.getByRole("button", { name: "Voltar às pré-reservas" }),
        );
        expect(await screen.findByText("Cancelada")).toBeTruthy();

        await user.click(
            screen.getByRole("button", {
                name: "Ver solicitação: Sabores e caminhos do Cerrado",
            }),
        );
        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Pré-reserva cancelada",
            }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Cancelar solicitação" }),
        ).toBeNull();
    });

    it("CA04: Manter solicitação volta ao detalhe sem alterar nada", async () => {
        const fetchMock = api();
        seedSession("consumer");
        window.location.hash = "#/reservas/b1/cancelar";
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", { name: "Manter solicitação" }),
        );

        await waitFor(() => expect(window.location.hash).toBe("#/reservas/b1"));
        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Aguardando resposta",
            }),
        ).toBeTruthy();
        expect(cancelCalls(fetchMock)).toHaveLength(0);
    });

    it("CA05: pré-reserva de outra conta não pode ser cancelada", async () => {
        const fetchMock = api();
        seedSession("consumer");
        window.location.hash = "#/reservas/de-outra-conta/cancelar";
        render(<App />);

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Pré-reserva não encontrada",
            }),
        ).toBeTruthy();
        expect(cancelCalls(fetchMock)).toHaveLength(0);
    });

    it("CA07: falha no cancelamento avisa e mantém a situação anterior", async () => {
        api({ cancelFails: true });
        seedSession("consumer");
        window.location.hash = "#/reservas/b1/cancelar";
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", {
                name: "Sim, cancelar solicitação",
            }),
        );

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /O cancelamento não foi concluído/,
        );
        await user.click(
            screen.getByRole("button", { name: "Manter solicitação" }),
        );
        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Aguardando resposta",
            }),
        ).toBeTruthy();
    });

    it("a produtora não chega à confirmação: volta ao detalhe", async () => {
        const fetchMock = api();
        seedSession("producer");
        window.location.hash = "#/reservas/b1/cancelar";
        render(<App />);

        await waitFor(() => expect(window.location.hash).toBe("#/reservas/b1"));
        expect(
            screen.queryByRole("heading", { name: "Cancelar solicitação?" }),
        ).toBeNull();
        expect(cancelCalls(fetchMock)).toHaveLength(0);
    });

    it("sem sessão, pede para entrar e não consulta a API", async () => {
        const fetchMock = api();
        window.location.hash = "#/reservas/b1/cancelar";
        render(<App />);

        expect(
            await screen.findByRole("heading", { name: "Entre em sua conta" }),
        ).toBeTruthy();
        expect(
            fetchMock.mock.calls.filter(([input]) =>
                String(input).includes("/bookings"),
            ),
        ).toHaveLength(0);
    });
});
