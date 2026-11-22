import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import type { BookingResponse } from "@/features/bookings/bookingTypes";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const origin = "https://api.cafuringa.test";
const consumerName = "Ana Oliveira";
const consumerMessage = "Gostaríamos de conhecer o sítio.";
const reply = "Podemos receber vocês às 9h. Até lá!";
const token = "token-de-teste";
type ReceivedBooking = BookingResponse & {
    codigo: string;
    experienciaNome: string;
    consumidorNome: string;
    valorTotal: number;
    mensagemResposta?: string;
};

const booking: ReceivedBooking = {
    id: "reserva-124",
    experienciaId: "experiencia-1",
    codigo: "CAF-0124",
    experienciaNome: "Sabores e caminhos do Cerrado",
    consumidorNome: consumerName,
    data: "2026-10-17",
    horario: "09:00",
    participantes: 2,
    valorTotal: 90,
    formaPagamento: "pix",
    mensagem: consumerMessage,
    status: "pendente",
    criadoEm: "2026-10-01T12:00:00Z",
};

const accepted: ReceivedBooking = {
    ...booking,
    id: "reserva-125",
    consumidorNome: "Carlos de Andrade",
    status: "aceita",
    mensagemResposta: "Até sábado!",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

// Contrato provisório de teste: alinhar URLs, DTOs e códigos com a API da HU47.
const bookingsPath = "/api/v1/bookings/received";
const bookingPath = `${bookingsPath}/${booking.id}`;
const detailRoute = `#/notificacoes/${booking.id}`;

function mockApi() {
    let current = booking;
    const read = vi.fn(() => json(current));
    const answer = vi.fn(
        (_url: URL, _headers: Headers, body: unknown): Response => {
            current = {
                ...booking,
                ...(body as Pick<
                    typeof current,
                    "status" | "mensagemResposta"
                >),
            };
            return json(current);
        },
    );
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
        const url = new URL(String(input), origin);
        const method = init?.method ?? "GET";
        if (url.pathname === "/api/v1/auth/me" && method === "GET") {
            return json({
                id: "produtor-1",
                nome: "Produtor de teste",
                email: "produtor@example.test",
            });
        }
        if (url.pathname === bookingsPath && method === "GET") {
            return json([current, accepted]);
        }
        if (url.pathname === bookingPath && method === "GET") return read();
        if (
            url.pathname === `${bookingsPath}/${accepted.id}` &&
            method === "GET"
        ) {
            return json(accepted);
        }
        if (url.pathname === `${bookingPath}/response` && method === "PATCH") {
            return answer(
                url,
                new Headers(init?.headers),
                JSON.parse(String(init?.body)),
            );
        }
        return json({ message: "Rota inexistente" }, 404);
    });

    vi.stubGlobal("fetch", fetchMock);
    return { answer, read, fetchMock };
}

function start(route = "#/notificacoes") {
    window.location.hash = route;
    return { ...render(<App />), user: userEvent.setup() };
}

async function openPending(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole("link", { name: /^Responder/ }));
    await screen.findByRole("heading", { name: "Pendente" });
}

function expectNoAnswerActions() {
    expect(
        screen.queryByRole("button", { name: "Aceitar pré-reserva" }),
    ).toBeNull();
    expect(
        screen.queryByRole("button", { name: "Recusar solicitação" }),
    ).toBeNull();
}

describe("HU47 — responder pré-reserva de experiência", () => {
    beforeEach(() => {
        vi.stubEnv("VITE_API_URL", `${origin}/api/v1`);
        localStorage.setItem("cafuringa-role", "producer");
        localStorage.setItem("cafuringa-token", token);
        localStorage.setItem("cafuringa-user-id", "produtor-1");
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        sessionStorage.clear();
        window.location.hash = "";
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it("CA01 e CA02: consulta as solicitações do produtor e abre os dados da pendente", async () => {
        const { fetchMock } = mockApi();
        const { user } = start();

        await screen.findByRole("heading", { name: "Notificações" });
        expect(await screen.findByText(/1 solicitação.*aguarda/)).toBeTruthy();
        expect(screen.getByText(consumerName)).toBeTruthy();
        expect(screen.getByText(accepted.consumidorNome)).toBeTruthy();
        const listCall = fetchMock.mock.calls.find(([url]) =>
            String(url).endsWith(bookingsPath),
        );
        expect(new Headers(listCall?.[1]?.headers).get("Authorization")).toBe(
            `Bearer ${token}`,
        );

        await openPending(user);
        for (const value of [
            /CAF-0124/,
            consumerName,
            "17/10/2026",
            "09h00",
            "2 participantes",
            /R\$\s*90,00/,
            "Pix",
            consumerMessage,
        ]) {
            expect(screen.getByText(value)).toBeTruthy();
        }
        expect(
            screen.getByRole("textbox", { name: /Mensagem para Ana Oliveira/ }),
        ).toBeTruthy();
    });

    it.each([
        { action: "Aceitar pré-reserva", status: "aceita", label: "Aceito" },
        {
            action: "Recusar solicitação",
            status: "recusada",
            label: "Recusado",
        },
    ])(
        "CA03, CA04 e CA07: $action, confirma o envio e atualiza o detalhe",
        async ({ action, status, label }) => {
            const { answer } = mockApi();
            const { user } = start();
            await openPending(user);
            await user.type(
                screen.getByRole("textbox", { name: /Mensagem para/ }),
                reply,
            );
            await user.click(screen.getByRole("button", { name: action }));
            if (status === "recusada") {
                await screen.findByRole("heading", {
                    name: "Cancelar a solicitação?",
                });
                expect(answer).not.toHaveBeenCalled();
                await user.click(
                    screen.getByRole("button", {
                        name: "Sim, cancelar solicitação",
                    }),
                );
            }

            await screen.findByRole("heading", { name: "Resposta enviada" });
            expect(screen.getByText(/receberá uma notificação/)).toBeTruthy();
            screen.getByRole("button", { name: "Voltar ao painel" });
            expect(answer).toHaveBeenCalledTimes(1);
            const [url, headers, payload] = answer.mock.calls[0];
            expect(url.href).toBe(`${origin}${bookingPath}/response`);
            expect(headers.get("Authorization")).toBe(`Bearer ${token}`);
            expect(payload).toEqual({ status, mensagemResposta: reply });

            await user.click(
                screen.getByRole("button", { name: "Ver pré-reservas" }),
            );
            const details = await screen.findAllByRole("link", {
                name: /^Ver detalhes/,
            });
            expect(
                screen.queryByRole("link", { name: /^Responder/ }),
            ).toBeNull();
            const updated = details.find(
                (link) => link.getAttribute("href") === detailRoute,
            );
            expect(updated).toBeDefined();
            await user.click(updated!);
            await screen.findByRole("heading", { name: label });
            expect(screen.getByText(reply)).toBeTruthy();
            expectNoAnswerActions();
            for (const storage of [localStorage, sessionStorage]) {
                const stored = Object.values(storage).join();
                for (const privateValue of [
                    consumerName,
                    consumerMessage,
                    reply,
                ]) {
                    expect(stored).not.toContain(privateValue);
                }
            }
        },
    );

    it("CA03 e RNF03: voltar da confirmação de recusa preserva a pendência e o rascunho", async () => {
        const { answer } = mockApi();
        const { user } = start();
        await openPending(user);
        await user.type(
            screen.getByRole("textbox", { name: /Mensagem para/ }),
            reply,
        );
        await user.click(
            screen.getByRole("button", { name: "Recusar solicitação" }),
        );
        await screen.findByRole("heading", { name: "Cancelar a solicitação?" });
        await user.click(screen.getByRole("button", { name: "Voltar" }));
        await screen.findByRole("heading", { name: "Pendente" });
        expect(
            screen.getByRole<HTMLTextAreaElement>("textbox", {
                name: /Mensagem para/,
            }).value,
        ).toBe(reply);
        expect(answer).not.toHaveBeenCalled();
    });

    it.each(["visitante", "consumer", "produtor sem token"])(
        "CA05 e RNF08: %s não consulta nem responde pelo endereço direto",
        async (profile) => {
            const { fetchMock } = mockApi();
            if (profile === "consumer") {
                localStorage.setItem("cafuringa-role", "consumer");
            } else {
                localStorage.removeItem("cafuringa-token");
                if (profile === "visitante")
                    localStorage.removeItem("cafuringa-role");
            }
            start(detailRoute);

            await waitFor(() =>
                expect(window.location.hash).not.toBe(detailRoute),
            );
            expectNoAnswerActions();
            expect(
                fetchMock.mock.calls.some(([url]) =>
                    String(url).includes(bookingsPath),
                ),
            ).toBe(false);
        },
    );

    it("CA05 e RNF11: trata acesso direto negado sem exibir dados de outro produtor", async () => {
        const { answer, read } = mockApi();
        read.mockReturnValue(
            json({ message: "Acesso negado", ...booking }, 403),
        );
        start(detailRoute);

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /acesso|permissão/i,
        );
        expect(screen.queryByText(consumerName)).toBeNull();
        expect(screen.queryByText(consumerMessage)).toBeNull();
        expectNoAnswerActions();
        expect(answer).not.toHaveBeenCalled();
    });

    it("CA05: se a API negar o envio após abrir o detalhe, informa a falta de permissão", async () => {
        const { answer } = mockApi();
        answer.mockReturnValue(json({ message: "Acesso negado" }, 403));
        const { user } = start();
        await openPending(user);
        await user.click(
            screen.getByRole("button", { name: "Aceitar pré-reserva" }),
        );

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /acesso|permissão/i,
        );
        expectNoAnswerActions();
        expect(
            screen.queryByRole("heading", { name: "Resposta enviada" }),
        ).toBeNull();
    });

    it("CA06: exibe a situação atual quando outra operação responde antes do envio", async () => {
        const { answer, read } = mockApi();
        answer.mockImplementation(() => {
            read.mockReturnValue(json({ ...booking, status: "recusada" }));
            return json({ message: "Solicitação já respondida" }, 409);
        });
        const { user } = start();
        await openPending(user);
        await user.click(
            screen.getByRole("button", { name: "Aceitar pré-reserva" }),
        );

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /respondida|indisponível/i,
        );
        await screen.findByRole("heading", { name: "Recusado" });
        expectNoAnswerActions();
        expect(
            screen.queryByRole("heading", { name: "Resposta enviada" }),
        ).toBeNull();
    });

    it("RN21: informa que não pode aceitar uma solicitação com horário passado", async () => {
        const { answer } = mockApi();
        answer.mockReturnValue(
            json(
                {
                    message:
                        "Não é possível aceitar uma pré-reserva com data e horário passados.",
                },
                400,
            ),
        );
        const { user } = start();
        await openPending(user);
        await user.click(
            screen.getByRole("button", { name: "Aceitar pré-reserva" }),
        );

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /não é possível aceitar.*passados/i,
        );
        expect(screen.getByRole("heading", { name: "Pendente" })).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Recusar solicitação" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", { name: "Resposta enviada" }),
        ).toBeNull();
    });

    it("CA08 e RNF03: falha de registro preserva a pendência e permite tentar novamente", async () => {
        const { answer } = mockApi();
        answer.mockReturnValueOnce(json({ message: "Falha interna" }, 500));
        const { user } = start();
        await openPending(user);
        await user.type(
            screen.getByRole("textbox", { name: /Mensagem para/ }),
            reply,
        );
        await user.click(
            screen.getByRole("button", { name: "Aceitar pré-reserva" }),
        );

        expect((await screen.findByRole("alert")).textContent).toMatch(
            /não foi (possível|registrada)|tente novamente/i,
        );
        expect(screen.getByRole("heading", { name: "Pendente" })).toBeTruthy();
        expect(
            screen.getByRole<HTMLTextAreaElement>("textbox", {
                name: /Mensagem para/,
            }).value,
        ).toBe(reply);
        expect(
            screen.queryByRole("heading", { name: "Resposta enviada" }),
        ).toBeNull();
        await user.click(
            screen.getByRole("button", { name: "Aceitar pré-reserva" }),
        );
        await screen.findByRole("heading", { name: "Resposta enviada" });
        expect(answer).toHaveBeenCalledTimes(2);
    });

    it("RNF04: formulário de resposta tem rótulos e permite chegar às ações pelo teclado", async () => {
        mockApi();
        const { container, user } = start(detailRoute);
        await screen.findByRole("heading", { name: "Pendente" });
        const message = screen.getByRole("textbox", { name: /Mensagem para/ });
        message.focus();
        await user.tab();
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Aceitar pré-reserva" }),
        );
        await user.tab();
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Recusar solicitação" }),
        );
        const result = await axe.run(container, {
            rules: { "color-contrast": { enabled: false } },
        });
        expect(result.violations).toEqual([]);
    });
});
