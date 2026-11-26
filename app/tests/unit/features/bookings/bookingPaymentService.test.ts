import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/shared/api/client";
import { BookingSessionError } from "@/features/bookings/bookingService";
import {
    BookingPaymentError,
    confirmDeposit,
    reportDepositNotFound,
    reportDepositSent,
} from "@/features/bookings/bookingPaymentService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

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

const pagamento = (situacao: string) => ({
    total: 182,
    sinal: 91,
    restante: 91,
    situacao,
    prazoSinal: "2026-11-22T13:30:00.000Z",
});

beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    localStorage.setItem("cafuringa-token", "token-1");
});

describe("sinal por Pix — chamadas à API", () => {
    it.each([
        [
            "a consumidora avisa que pagou",
            reportDepositSent,
            "/bookings/b%201/payment/sent",
            "comprovante-enviado",
        ],
        [
            "a produtora confirma o sinal",
            confirmDeposit,
            "/bookings/received/b%201/payment/confirm",
            "sinal-confirmado",
        ],
        [
            "a produtora não encontrou o pagamento",
            reportDepositNotFound,
            "/bookings/received/b%201/payment/not-found",
            "aguardando-sinal",
        ],
    ] as const)("%s", async (_caso, action, path, situacao) => {
        fetchMock.mockResolvedValue(json(pagamento(situacao)));

        const result = await action("b 1", { client });

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`http://api.test/api/v1${path}`);
        expect(init.method).toBe("PATCH");
        expect(new Headers(init.headers).get("Authorization")).toBe(
            "Bearer token-1",
        );
        expect(result).toEqual({
            totalCents: 18200,
            depositCents: 9100,
            remainingCents: 9100,
            status: situacao,
            depositDeadline: "2026-11-22T13:30:00.000Z",
        });
    });

    it("409: o motivo da API vira a mensagem do erro", async () => {
        fetchMock.mockResolvedValue(
            json(
                {
                    statusCode: 409,
                    message:
                        "O prazo para pagar o sinal terminou. Fale com a produtora.",
                    error: "Conflict",
                },
                409,
            ),
        );

        await expect(reportDepositSent("b1", { client })).rejects.toEqual(
            new BookingPaymentError(
                "O prazo para pagar o sinal terminou. Fale com a produtora.",
            ),
        );
    });

    it("404: pré-reserva não encontrada", async () => {
        fetchMock.mockResolvedValue(
            json({ statusCode: 404, message: "x", error: "Not Found" }, 404),
        );

        await expect(confirmDeposit("b1", { client })).rejects.toEqual(
            new BookingPaymentError("Pré-reserva não encontrada."),
        );
    });

    it("401 ou sem sessão: pede para entrar de novo", async () => {
        fetchMock.mockResolvedValue(
            json({ statusCode: 401, message: "x", error: "Unauthorized" }, 401),
        );
        await expect(
            reportDepositSent("b1", { client }),
        ).rejects.toBeInstanceOf(BookingSessionError);

        localStorage.clear();
        await expect(confirmDeposit("b1", { client })).rejects.toBeInstanceOf(
            BookingSessionError,
        );
    });
});
