import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/shared/api/client";
import { ApiHttpError } from "@/shared/api/errors";
import { BookingSessionError } from "@/features/bookings/bookingService";
import {
    getBooking,
    listMyBookings,
    listReceivedBookings,
} from "@/features/bookings/bookingQueryService";
import type { ApiBookingDetail } from "@/features/bookings/bookingDetails";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const item: ApiBookingDetail = {
    id: "64b0c0ffee0000000000b001",
    experienciaId: "64b0c0ffee0000000000e001",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    status: "pendente",
    criadoEm: "2026-11-19T13:00:00.000Z",
    atualizadoEm: "2026-11-19T13:00:00.000Z",
    experiencia: {
        nome: "Sabores e caminhos do Cerrado",
        local: "Sítio Raízes",
        valorPorPessoa: 45,
        disponivel: true,
    },
    contraparte: { id: "p1", nome: "Sítio Raízes" },
};

const page = (itens: ApiBookingDetail[], total = itens.length) => ({
    itens,
    total,
    pagina: 1,
    limite: 50,
});

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });

const fetchMock = vi.fn();
const client = createApiClient({
    baseUrl: "http://api.test/api/v1",
    fetch: fetchMock as unknown as typeof fetch,
    generateRequestId: () => "req-1",
});

const lastRequest = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    return {
        url: new URL(url),
        init,
        headers: init.headers as Record<string, string>,
    };
};

beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    localStorage.setItem("cafuringa-token", "abc123");
});

describe("HU45 — listMyBookings (consumidora, CA01, CA02)", () => {
    it("consulta GET /bookings/mine com o token e até 50 itens", async () => {
        fetchMock.mockResolvedValue(json(page([item])));

        await listMyBookings({ client });

        const { url, init, headers } = lastRequest();
        expect(url.pathname).toBe("/api/v1/bookings/mine");
        expect(url.searchParams.get("limite")).toBe("50");
        expect(init.method).toBe("GET");
        expect(headers.Authorization).toBe("Bearer abc123");
    });

    it("devolve as solicitações adaptadas e o total", async () => {
        fetchMock.mockResolvedValue(json(page([item], 3)));

        const result = await listMyBookings({ client });

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({
            id: item.id,
            status: "pendente",
            experience: { name: "Sabores e caminhos do Cerrado" },
            counterpart: { name: "Sítio Raízes" },
        });
    });

    it("CA06: sem solicitações devolve lista vazia", async () => {
        fetchMock.mockResolvedValue(json(page([])));

        await expect(listMyBookings({ client })).resolves.toEqual({
            items: [],
            total: 0,
        });
    });
});

describe("HU45 — listReceivedBookings (produtora, CA01, CA03)", () => {
    it("consulta GET /bookings/received com o token", async () => {
        fetchMock.mockResolvedValue(json(page([item])));

        const result = await listReceivedBookings({ client });

        const { url, headers } = lastRequest();
        expect(url.pathname).toBe("/api/v1/bookings/received");
        expect(url.searchParams.get("limite")).toBe("50");
        expect(headers.Authorization).toBe("Bearer abc123");
        expect(result.items[0].id).toBe(item.id);
    });
});

describe("HU45 — getBooking (CA04, CA05, CA07)", () => {
    it("consulta GET /bookings/:id com o id codificado", async () => {
        fetchMock.mockResolvedValue(json({ ...item, status: "aceita" }));

        const detail = await getBooking("a/b", { client });

        expect(lastRequest().url.pathname).toBe("/api/v1/bookings/a%2Fb");
        expect(lastRequest().headers.Authorization).toBe("Bearer abc123");
        expect(detail?.status).toBe("aceita");
    });

    it("CA05: 404 (de outra conta ou inexistente) vira null, sem erro", async () => {
        fetchMock.mockResolvedValue(
            json(
                { statusCode: 404, message: "Pré-reserva não encontrada" },
                404,
            ),
        );

        await expect(getBooking(item.id, { client })).resolves.toBeNull();
    });
});

describe("HU45 — sessão e respostas inválidas", () => {
    it.each([
        ["listMyBookings", () => listMyBookings({ client })],
        ["listReceivedBookings", () => listReceivedBookings({ client })],
        ["getBooking", () => getBooking(item.id, { client })],
    ])(
        "%s sem token falha como sessão ausente, sem chamar a API",
        async (_nome, call) => {
            localStorage.removeItem("cafuringa-token");

            await expect(call()).rejects.toBeInstanceOf(BookingSessionError);
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );

    it("401 da API vira sessão ausente", async () => {
        fetchMock.mockResolvedValue(
            json({ statusCode: 401, message: "Unauthorized" }, 401),
        );

        await expect(listMyBookings({ client })).rejects.toBeInstanceOf(
            BookingSessionError,
        );
    });

    it("outros erros da API sobem para a tela tratar", async () => {
        fetchMock.mockResolvedValue(
            json({ statusCode: 500, message: "Erro interno" }, 500),
        );

        await expect(listMyBookings({ client })).rejects.toBeInstanceOf(
            ApiHttpError,
        );
    });

    it.each([
        ["lista sem itens", { total: 0 }],
        [
            "item sem situação válida",
            page([{ ...item, status: "outra" } as never]),
        ],
        [
            "item sem experiência",
            page([{ ...item, experiencia: undefined } as never]),
        ],
    ])("recusa resposta fora do formato: %s", async (_caso, body) => {
        fetchMock.mockResolvedValue(json(body));

        await expect(listMyBookings({ client })).rejects.toThrow(
            "Resposta de pré-reservas inválida.",
        );
    });

    it("recusa detalhe fora do formato", async () => {
        fetchMock.mockResolvedValue(json({ id: item.id }));

        await expect(getBooking(item.id, { client })).rejects.toThrow(
            "Resposta de pré-reserva inválida.",
        );
    });
});
