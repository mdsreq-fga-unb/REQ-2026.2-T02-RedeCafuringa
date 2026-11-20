import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/shared/api/client";
import { ApiHttpError } from "@/shared/api/errors";
import { createBooking } from "@/features/bookings/bookingService";
import { describeBookingError } from "@/features/bookings/bookingErrors";
import { listMockBookings } from "@/features/bookings/mockBookingService";
import type {
    BookingPayload,
    BookingResponse,
} from "@/features/bookings/bookingTypes";

const mode = vi.hoisted(() => ({ mock: false }));
vi.mock("@/features/auth/authMode", () => ({
    get isMockAuthEnabled() {
        return mode.mock;
    },
}));

const payload: BookingPayload = {
    experienciaId: "64b0c0ffee0000000000e001",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
};

const apiResponse: BookingResponse = {
    id: "64b0c0ffee0000000000b001",
    experienciaId: payload.experienciaId,
    data: payload.data,
    horario: payload.horario,
    participantes: 2,
    formaPagamento: "pix",
    mensagem: payload.mensagem,
    status: "pendente",
    criadoEm: "2026-11-19T13:00:00.000Z",
};

const json = (body: unknown, status = 201) =>
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

describe("createBooking: API real (HU44 CA05)", () => {
    beforeEach(() => {
        mode.mock = false;
        fetchMock.mockReset();
        localStorage.clear();
        localStorage.setItem("cafuringa-token", "abc123");
    });

    it("envia POST /bookings com o corpo e devolve a pré-reserva adaptada", async () => {
        fetchMock.mockResolvedValue(json(apiResponse));

        const booking = await createBooking(payload, undefined, client);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("http://api.test/api/v1/bookings");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(payload);
        expect(booking).toMatchObject({
            id: "64b0c0ffee0000000000b001",
            experienceId: payload.experienciaId,
            status: "pendente",
        });
    });

    it("envia o token de acesso no cabeçalho Authorization", async () => {
        fetchMock.mockResolvedValue(json(apiResponse));
        await createBooking(payload, undefined, client);
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
            "Bearer abc123",
        );
    });

    it("rejeita com 401, sem chamar a API, quando não há sessão", async () => {
        localStorage.removeItem("cafuringa-token");
        await expect(
            createBooking(payload, undefined, client),
        ).rejects.toMatchObject({ status: 401 });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("propaga o erro HTTP da API (experiência indisponível: 404)", async () => {
        fetchMock.mockResolvedValue(
            json(
                {
                    statusCode: 404,
                    message: "Experiência não encontrada",
                    error: "Not Found",
                },
                404,
            ),
        );
        const error = await createBooking(payload, undefined, client).catch(
            (e: unknown) => e,
        );
        expect(error).toBeInstanceOf(ApiHttpError);
        expect(error).toMatchObject({ status: 404 });
    });

    it("trata a falta de conexão como falha de envio", async () => {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
        const error = await createBooking(payload, undefined, client).catch(
            (e: unknown) => e,
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(describeBookingError(error)).toContain(
            "Não foi possível enviar a pré-reserva",
        );
    });

    it("rejeita uma resposta sem id", async () => {
        fetchMock.mockResolvedValue(json({ ...apiResponse, id: "" }));
        await expect(createBooking(payload, undefined, client)).rejects.toThrow(
            "Resposta de pré-reserva inválida.",
        );
    });

    it("rejeita uma resposta com status desconhecido", async () => {
        fetchMock.mockResolvedValue(
            json({ ...apiResponse, status: "confirmada" }),
        );
        await expect(createBooking(payload, undefined, client)).rejects.toThrow(
            "Resposta de pré-reserva inválida.",
        );
    });
});

describe("createBooking: modo demonstração", () => {
    beforeEach(() => {
        mode.mock = true;
        fetchMock.mockReset();
        localStorage.clear();
    });

    it("usa o serviço mock e não chama a API", async () => {
        const booking = await createBooking(payload, undefined, client);
        expect(booking.status).toBe("pendente");
        expect(fetchMock).not.toHaveBeenCalled();
        expect(listMockBookings()).toHaveLength(1);
    });

    it("não exige token de acesso", async () => {
        localStorage.removeItem("cafuringa-token");
        await expect(
            createBooking(payload, undefined, client),
        ).resolves.toMatchObject({ status: "pendente" });
    });
});
