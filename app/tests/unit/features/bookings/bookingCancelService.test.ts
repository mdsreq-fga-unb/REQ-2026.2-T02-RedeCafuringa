import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/shared/api/client";
import { ApiHttpError } from "@/shared/api/errors";
import { BookingSessionError } from "@/features/bookings/bookingService";
import {
    BookingCancelError,
    cancelBooking,
} from "@/features/bookings/bookingCancelService";
import type { BookingResponse } from "@/features/bookings/bookingTypes";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const cancelled: BookingResponse = {
    id: "64b0c0ffee0000000000b001",
    experienciaId: "64b0c0ffee0000000000e001",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    mensagem: "Vamos com duas crianças.",
    status: "cancelada",
    criadoEm: "2026-11-19T13:00:00.000Z",
};

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

const failure = async (call: Promise<unknown>) =>
    call.then(
        () => {
            throw new Error("deveria ter falhado");
        },
        (error: unknown) => error,
    );

beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    localStorage.setItem("cafuringa-token", "abc123");
});

describe("HU46 — cancelBooking (API real)", () => {
    it("CA03: envia PATCH /bookings/:id/cancel com o token e sem corpo", async () => {
        fetchMock.mockResolvedValue(json(cancelled));

        await cancelBooking(cancelled.id, { client });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(
            "http://api.test/api/v1/bookings/64b0c0ffee0000000000b001/cancel",
        );
        expect(init.method).toBe("PATCH");
        expect(init.body).toBeUndefined();
        expect((init.headers as Record<string, string>).Authorization).toBe(
            "Bearer abc123",
        );
    });

    it("codifica o id no caminho", async () => {
        fetchMock.mockResolvedValue(json({ ...cancelled, id: "a/b" }));

        await cancelBooking("a/b", { client });

        expect(fetchMock.mock.calls[0][0]).toBe(
            "http://api.test/api/v1/bookings/a%2Fb/cancel",
        );
    });

    it("CA06: devolve a solicitação com a situação atualizada", async () => {
        fetchMock.mockResolvedValue(json(cancelled));

        const booking = await cancelBooking(cancelled.id, { client });

        expect(booking).toMatchObject({
            id: cancelled.id,
            status: "cancelada",
            experienceId: cancelled.experienciaId,
        });
    });

    it("CA05: 404 (de outra conta ou inexistente) vira 'não encontrada'", async () => {
        fetchMock.mockResolvedValue(
            json(
                {
                    statusCode: 404,
                    message: "Pré-reserva não encontrada",
                    error: "Not Found",
                },
                404,
            ),
        );

        const error = await failure(cancelBooking(cancelled.id, { client }));

        expect(error).toBeInstanceOf(BookingCancelError);
        expect((error as BookingCancelError).reason).toBe("nao-encontrada");
        expect((error as BookingCancelError).message).toBe(
            "Pré-reserva não encontrada.",
        );
    });

    it("RN20: 409 traz o motivo dado pelo servidor", async () => {
        fetchMock.mockResolvedValue(
            json(
                {
                    statusCode: 409,
                    message:
                        "Esta pré-reserva já foi aceita: apenas o produtor responsável pode cancelá-la",
                    error: "Conflict",
                },
                409,
            ),
        );

        const error = await failure(cancelBooking(cancelled.id, { client }));

        expect(error).toBeInstanceOf(BookingCancelError);
        expect((error as BookingCancelError).reason).toBe("nao-cancelavel");
        expect((error as BookingCancelError).message).toBe(
            "Esta pré-reserva já foi aceita: apenas o produtor responsável pode cancelá-la",
        );
    });

    it("sem token falha como sessão ausente, sem chamar a API", async () => {
        localStorage.removeItem("cafuringa-token");

        await expect(
            cancelBooking(cancelled.id, { client }),
        ).rejects.toBeInstanceOf(BookingSessionError);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("401 vira sessão ausente", async () => {
        fetchMock.mockResolvedValue(
            json({ statusCode: 401, message: "Unauthorized" }, 401),
        );

        await expect(
            cancelBooking(cancelled.id, { client }),
        ).rejects.toBeInstanceOf(BookingSessionError);
    });

    it("CA07: outras falhas sobem para a tela tratar", async () => {
        fetchMock.mockResolvedValue(
            json({ statusCode: 500, message: "Erro interno" }, 500),
        );

        await expect(
            cancelBooking(cancelled.id, { client }),
        ).rejects.toBeInstanceOf(ApiHttpError);
    });

    it.each([
        ["sem id", { ...cancelled, id: "" }],
        ["sem situação válida", { ...cancelled, status: "outra" }],
        ["ainda pendente", { ...cancelled, status: "pendente" }],
    ])("recusa resposta fora do esperado: %s", async (_caso, body) => {
        fetchMock.mockResolvedValue(json(body));

        await expect(cancelBooking(cancelled.id, { client })).rejects.toThrow(
            "Resposta de cancelamento inválida.",
        );
    });
});
