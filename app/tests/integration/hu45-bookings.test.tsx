import {
    cleanup,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { json, seedSession } from "../fixtures/hu12";
import { renderAdminApp } from "../fixtures/renderAdminApp";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
// Sessão de administradora só existe depois do login (não é lida do navegador).
vi.mock("@/features/auth/authService", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/features/auth/authService")>()),
    login: async () => ({
        token: "admin-session-token",
        user: { id: "a1", name: "Administradora", role: "admin" },
    }),
}));

const detail = (overrides: Record<string, unknown> = {}) => ({
    id: "b1",
    experienciaId: "e1",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
    status: "pendente",
    criadoEm: "2026-11-19T13:00:00.000Z",
    atualizadoEm: "2026-11-19T13:00:00.000Z",
    experiencia: {
        nome: "Sabores e caminhos do Cerrado",
        local: "Sítio Raízes",
        valorPorPessoa: 45,
        disponivel: true,
    },
    contraparte: { id: "c1", nome: "Ana Souza" },
    ...overrides,
});

const page = (itens: unknown[]) => ({
    itens,
    total: itens.length,
    pagina: 1,
    limite: 50,
});

function api() {
    const fetchMock = vi.fn<typeof fetch>((input) => {
        const url = new URL(String(input), "http://localhost");
        const path = url.pathname;
        if (path === "/api/v1/bookings/mine")
            return Promise.resolve(json(page([detail()])));
        if (path === "/api/v1/bookings/received")
            return Promise.resolve(json(page([detail({ id: "b9" })])));
        if (path === "/api/v1/bookings/b1" || path === "/api/v1/bookings/b9")
            return Promise.resolve(
                json(detail({ id: path.split("/").at(-1) })),
            );
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

const bookingCalls = (fetchMock: ReturnType<typeof api>) =>
    fetchMock.mock.calls.filter(([input]) =>
        String(input).includes("/bookings"),
    );

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

describe("HU45 — consultar pré-reservas no app", () => {
    it("CA01, CA02, CA04: consumidora abre a lista e o detalhe com o token", async () => {
        const fetchMock = api();
        seedSession("consumer");
        window.location.hash = "#/reservas";
        const user = userEvent.setup();
        render(<App />);

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Minhas pré-reservas",
            }),
        ).toBeTruthy();
        await user.click(
            await screen.findByRole("button", {
                name: "Ver solicitação: Sabores e caminhos do Cerrado",
            }),
        );

        await waitFor(() => expect(window.location.hash).toBe("#/reservas/b1"));
        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Aguardando resposta",
            }),
        ).toBeTruthy();
        const urls = bookingCalls(fetchMock).map(
            ([input]) => new URL(String(input), "http://localhost").pathname,
        );
        expect(urls).toEqual(["/api/v1/bookings/mine", "/api/v1/bookings/b1"]);
        for (const [, init] of bookingCalls(fetchMock))
            expect(new Headers(init?.headers).get("Authorization")).toMatch(
                /^Bearer /,
            );
    });

    it("CA01, CA03: produtora chega às recebidas pelo menu inferior", async () => {
        const fetchMock = api();
        seedSession("producer");
        window.location.hash = "#/explorar";
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            within(
                screen.getByRole("navigation", { name: "Navegação principal" }),
            ).getByRole("button", { name: "Pré-reservas" }),
        );

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Pré-reservas recebidas",
            }),
        ).toBeTruthy();
        expect(
            await screen.findByText("Solicitada por Ana Souza"),
        ).toBeTruthy();
        expect(
            bookingCalls(fetchMock).map(
                ([input]) =>
                    new URL(String(input), "http://localhost").pathname,
            ),
        ).toEqual(["/api/v1/bookings/received"]);
    });

    it("CA05: pré-reserva de outra conta aparece só como não encontrada", async () => {
        api();
        seedSession("consumer");
        window.location.hash = "#/reservas/de-outra-conta";
        render(<App />);

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "Pré-reserva não encontrada",
            }),
        ).toBeTruthy();
        expect(screen.queryByText(/Sabores e caminhos/)).toBeNull();
    });

    it("sem sessão, pede para entrar e não consulta a API", async () => {
        const fetchMock = api();
        window.location.hash = "#/reservas/b1";
        render(<App />);

        expect(
            await screen.findByRole("heading", { name: "Entre em sua conta" }),
        ).toBeTruthy();
        expect(bookingCalls(fetchMock)).toHaveLength(0);
    });

    it("administradora recebe um aviso e não consulta a API", async () => {
        const fetchMock = api();
        await renderAdminApp("#/reservas");

        expect(
            await screen.findByText(
                "O perfil de administradora não tem pré-reservas.",
            ),
        ).toBeTruthy();
        expect(bookingCalls(fetchMock)).toHaveLength(0);
    });
});
