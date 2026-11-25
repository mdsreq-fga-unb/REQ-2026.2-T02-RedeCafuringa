import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/shared/api/client";
import {
    adaptBookingDetail,
    type ApiBookingDetail,
} from "@/features/bookings/bookingDetails";
import {
    BookingCancelError,
    cancelBooking,
    cancelBookingByProducer,
} from "@/features/bookings/bookingCancelService";
import {
    BookingPaymentError,
    reportDepositRefunded,
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

const cancelled = {
    id: "b1",
    experienciaId: "e1",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 4,
    formaPagamento: "pix",
    status: "cancelada",
    criadoEm: "2026-11-19T13:00:00.000Z",
};

beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    localStorage.setItem("cafuringa-token", "token-1");
});

const lastCall = () => fetchMock.mock.calls[0] as [string, RequestInit];

describe("cancelamento com sinal — API", () => {
    it("a consumidora cancela e fica sabendo o destino do sinal", async () => {
        fetchMock.mockResolvedValue(
            json({ ...cancelled, sinal: { resultado: "devolver", valor: 91 } }),
        );

        const result = await cancelBooking("b1", { client });

        expect(result.status).toBe("cancelada");
        expect(result.deposit).toEqual({ result: "devolver", cents: 9100 });
    });

    it("sem sinal pago, o cancelamento não traz o destino do sinal", async () => {
        fetchMock.mockResolvedValue(json(cancelled));

        expect((await cancelBooking("b1", { client })).deposit).toBeUndefined();
    });

    it("a produtora cancela pela rota dela", async () => {
        fetchMock.mockResolvedValue(
            json({ ...cancelled, sinal: { resultado: "devolver", valor: 91 } }),
        );

        const result = await cancelBookingByProducer("b 1", { client });

        expect(lastCall()[0]).toBe(
            "http://api.test/api/v1/bookings/received/b%201/cancel",
        );
        expect(lastCall()[1].method).toBe("PATCH");
        expect(result.deposit).toEqual({ result: "devolver", cents: 9100 });
    });

    it("produtora: 409 com o motivo da API", async () => {
        fetchMock.mockResolvedValue(
            json(
                {
                    statusCode: 409,
                    message:
                        "Esta pré-reserva ainda está pendente: responda aceitando ou recusando.",
                    error: "Conflict",
                },
                409,
            ),
        );

        await expect(cancelBookingByProducer("b1", { client })).rejects.toEqual(
            new BookingCancelError(
                "nao-cancelavel",
                "Esta pré-reserva ainda está pendente: responda aceitando ou recusando.",
            ),
        );
    });

    it("a produtora registra que devolveu o sinal", async () => {
        fetchMock.mockResolvedValue(
            json({
                total: 182,
                sinal: 91,
                restante: 91,
                situacao: "sinal-confirmado",
                devolucao: "feita",
            }),
        );

        const payment = await reportDepositRefunded("b1", { client });

        expect(lastCall()[0]).toBe(
            "http://api.test/api/v1/bookings/received/b1/payment/refunded",
        );
        expect(payment.refund).toBe("feita");
    });

    it("devolução já registrada: o motivo vira a mensagem", async () => {
        fetchMock.mockResolvedValue(
            json(
                {
                    statusCode: 409,
                    message: "A devolução do sinal já foi registrada.",
                    error: "Conflict",
                },
                409,
            ),
        );

        await expect(reportDepositRefunded("b1", { client })).rejects.toEqual(
            new BookingPaymentError("A devolução do sinal já foi registrada."),
        );
    });
});

describe("cancelamento com sinal — adaptador", () => {
    it.each(["pendente", "feita", "retido"] as const)(
        "devolução %s chega ao detalhe",
        (devolucao) => {
            const detail = adaptBookingDetail({
                ...cancelled,
                atualizadoEm: "2026-11-21T13:30:00.000Z",
                experiencia: {
                    nome: "Trilha",
                    local: "Sítio",
                    valorPorPessoa: 45.5,
                    disponivel: true,
                },
                contraparte: { id: "p1", nome: "Sítio" },
                pagamento: {
                    total: 182,
                    sinal: 91,
                    restante: 91,
                    situacao: "sinal-confirmado",
                    devolucao,
                },
            } as ApiBookingDetail);

            expect(detail.payment?.refund).toBe(devolucao);
        },
    );
});
