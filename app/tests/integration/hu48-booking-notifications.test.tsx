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
import type { BookingResponse } from "@/features/bookings/bookingTypes";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const origin = "https://api.cafuringa.test";
const token = "sessao-hu48";
const listPath = "/api/v1/bookings/notifications";
const listRoute = "#/notificacoes";
const detailRoute = "#/reservas/reserva-124";
const detailPath = "/api/v1/bookings/reserva-124";
const title = "Sabores e caminhos do Cerrado";
const producerMessage = "Podemos receber vocês às 9h. Até lá!";
const consumerMessage = "Gostaríamos de conhecer o sítio.";
const privateEmail = "pessoa@exemplo.test";
const privatePhone = "61998765432";

const pending = {
    id: "reserva-124",
    codigo: "CAF-0124",
    experienciaId: "experiencia-cerrado",
    experienciaNome: title,
    propriedade: "Sítio Raízes",
    data: "2026-10-17",
    horario: "09:00",
    participantes: 2,
    valorTotal: 90,
    formaPagamento: "pix",
    mensagem: consumerMessage,
    status: "pendente",
    criadoEm: "2026-10-01T12:00:00Z",
} satisfies BookingResponse & Record<string, unknown>;

const update = {
    id: "atualizacao-1",
    reservaId: pending.id,
    codigo: pending.codigo,
    experienciaNome: title,
    data: pending.data,
    horario: pending.horario,
    participantes: pending.participantes,
    status: "aceita",
    nova: true,
    atualizadoEm: "2026-10-02T12:00:00Z",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

// Contrato simulado para o frontend. Alinhar endpoints e campos com a API da HU48.
function mockApi() {
    const list = vi.fn(() => json([update]));
    const detail = vi.fn(() =>
        json({
            ...pending,
            status: "aceita",
            mensagemResposta: producerMessage,
        }),
    );
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
        const url = new URL(String(input), origin);
        const method = init?.method ?? "GET";
        if (method !== "GET") return json({ message: "Rota inexistente" }, 404);
        if (url.pathname === "/api/v1/auth/me") {
            return json({
                id: "titular",
                nome: "Pessoa de teste",
                email: privateEmail,
            });
        }
        if (url.pathname === listPath) return list();
        if (url.pathname === detailPath) return detail();
        return json({ message: "Rota inexistente" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    return { list, detail, fetchMock };
}

function renderAt(route: string) {
    window.location.hash = route;
    return { user: userEvent.setup(), ...render(<App />) };
}

function expectProtectedRead(
    fetchMock: ReturnType<typeof mockApi>["fetchMock"],
    path: string,
) {
    const call = fetchMock.mock.calls.find(
        ([url]) => String(url) === `${origin}${path}`,
    );
    expect(call).toBeDefined();
    expect(new Headers(call?.[1]?.headers).get("Authorization")).toBe(
        `Bearer ${token}`,
    );
}

describe("HU48 — notificações de alteração de pré-reserva", () => {
    beforeEach(() => {
        vi.stubEnv("VITE_API_URL", `${origin}/api/v1`);
        localStorage.setItem("cafuringa-role", "consumer");
        localStorage.setItem("cafuringa-token", token);
        localStorage.setItem("cafuringa-user-id", "titular");
    });

    afterEach(() => {
        cleanup();
        window.location.hash = "";
        localStorage.clear();
        sessionStorage.clear();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it("CA01–CA05: sinaliza a alteração registrada, identifica a solicitação e abre o detalhe correspondente", async () => {
        const { fetchMock } = mockApi();
        const { user } = renderAt(listRoute);
        await screen.findByRole("heading", { name: "Notificações" });
        expect(
            await screen.findByText(/você tem novas atualizações/i),
        ).toBeTruthy();
        const card = within(await screen.findByRole("listitem"));
        expect(card.getByText("Nova atualização")).toBeTruthy();
        expect(card.getByText(title)).toBeTruthy();
        expect(card.getByText(pending.codigo)).toBeTruthy();
        expect(card.getByText("Aceito")).toBeTruthy();
        expectProtectedRead(fetchMock, listPath);

        await user.click(card.getByRole("link", { name: /^Ver detalhes/ }));
        await screen.findByRole("heading", { name: "Pré-reserva aceita" });
        expect(window.location.hash).toBe(detailRoute);
        expect(screen.getByText(pending.codigo)).toBeTruthy();
        expect(screen.getByText(producerMessage)).toBeTruthy();
        expectProtectedRead(fetchMock, detailPath);
    });

    it("CA02–CA04 e RN22: produtor consulta o cancelamento da solicitação vinculada", async () => {
        localStorage.setItem("cafuringa-role", "producer");
        const { list, fetchMock } = mockApi();
        list.mockReturnValue(json([{ ...update, status: "cancelada" }]));
        renderAt(listRoute);

        const card = within(await screen.findByRole("listitem"));
        expect(card.getByText("Cancelado")).toBeTruthy();
        expect(card.getByText(pending.codigo)).toBeTruthy();
        expectProtectedRead(fetchMock, listPath);
    });

    it("CA05: o link direto de um visitante exige login antes de consultar dados", async () => {
        localStorage.clear();
        const { detail } = mockApi();
        renderAt(detailRoute);

        await waitFor(() =>
            expect(window.location.hash).toMatch(/^#\/login\/consumer/),
        );
        expect(detail).not.toHaveBeenCalled();
        expect(screen.queryByText(producerMessage)).toBeNull();
    });

    it.each([403, 404])(
        "CA05 e CA08: esconde o conteúdo de uma solicitação inacessível (%i)",
        async (status) => {
            const { detail } = mockApi();
            detail.mockReturnValue(
                json(
                    {
                        ...pending,
                        email: privateEmail,
                        message: "Acesso negado",
                    },
                    status,
                ),
            );
            renderAt(detailRoute);

            const alert = await screen.findByRole("alert");
            expect(alert.textContent).toMatch(
                /permissão|indisponível|não encontrada/i,
            );
            expect(screen.queryByText(consumerMessage)).toBeNull();
            expect(screen.queryByText(privateEmail)).toBeNull();
            expect(screen.queryByText(pending.codigo)).toBeNull();
        },
    );

    it("CA06: lista vazia não cria atualização para uma alteração que não foi registrada", async () => {
        const { list } = mockApi();
        list.mockReturnValue(json([]));
        renderAt(listRoute);

        expect(await screen.findByText(/nenhuma atualização/i)).toBeTruthy();
        expect(screen.queryByText("Nova atualização")).toBeNull();
        expect(
            screen.queryByRole("link", { name: /^Ver detalhes/ }),
        ).toBeNull();
    });

    it("CA07 e RNF03: falha de consulta permite nova tentativa sem afirmar que houve envio", async () => {
        const { list } = mockApi();
        list.mockReturnValueOnce(
            json({ message: "Serviço indisponível" }, 503),
        );
        const { user } = renderAt(listRoute);

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /não foi possível carregar/i,
        );
        expect(
            screen.queryByText(/notificação enviada|nova atualização/i),
        ).toBeNull();
        await user.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );
        expect(await screen.findByText("Nova atualização")).toBeTruthy();
        expect(list).toHaveBeenCalledTimes(2);
    });

    it("CA07 e RN22: falha no e-mail preserva a alteração registrada sem indicar envio bem-sucedido", async () => {
        const { detail } = mockApi();
        detail.mockReturnValue(
            json({
                ...pending,
                status: "aceita",
                mensagemResposta: producerMessage,
                notificacaoEmail: "falhou",
            }),
        );
        renderAt(detailRoute);

        await screen.findByRole("heading", { name: "Pré-reserva aceita" });
        expect(screen.getByText(producerMessage)).toBeTruthy();
        expect(
            screen.queryByText(
                /notificação enviada|e-mail enviado com sucesso/i,
            ),
        ).toBeNull();
    });

    it("CA08 e RNF11: usa apenas os dados necessários no cartão e no link", async () => {
        const { list } = mockApi();
        list.mockReturnValue(
            json([
                {
                    ...update,
                    consumidorEmail: privateEmail,
                    consumidorTelefone: privatePhone,
                    mensagem: consumerMessage,
                },
            ]),
        );
        renderAt(listRoute);

        const card = within(await screen.findByRole("listitem"));
        const href = card
            .getByRole("link", { name: /^Ver detalhes/ })
            .getAttribute("href");
        expect(href).toBe(detailRoute);
        for (const data of [privateEmail, privatePhone, consumerMessage]) {
            expect(card.queryByText(data, { exact: false })).toBeNull();
            expect(href).not.toContain(data);
        }
    });

    it.each([
        {
            status: "pendente",
            heading: "Aguardando resposta",
            label: "Sua mensagem",
            message: consumerMessage,
        },
        {
            status: "recusada",
            heading: "Pré-reserva recusada",
            label: "Mensagem do produtor",
            message: "Não teremos disponibilidade.",
        },
    ])(
        "apresenta os dados e a mensagem do detalhe $status",
        async ({ status, heading, label, message }) => {
            const { detail } = mockApi();
            detail.mockReturnValue(
                json({
                    ...pending,
                    status,
                    mensagemResposta:
                        status === "recusada" ? message : undefined,
                }),
            );
            renderAt(detailRoute);

            await screen.findByRole("heading", { name: heading });
            expect(screen.getByText(title)).toBeTruthy();
            expect(screen.getByText("17/10/2026")).toBeTruthy();
            expect(screen.getByText("2 participantes")).toBeTruthy();
            expect(screen.getByText(/R\$\s*90,00/)).toBeTruthy();
            expect(screen.getByText("Pix")).toBeTruthy();
            expect(screen.getByRole("heading", { name: label })).toBeTruthy();
            expect(screen.getByText(message)).toBeTruthy();
        },
    );
});
