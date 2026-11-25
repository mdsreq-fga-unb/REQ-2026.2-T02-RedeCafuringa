import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/shared/api/client";
import {
    reportPaymentReceived,
    waiveDeposit,
} from "@/features/bookings/bookingPaymentService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
    });

const fetchMock = vi.fn();
const client = createApiClient({
    baseUrl: "http://api.test/api/v1",
    fetch: fetchMock as unknown as typeof fetch,
    generateRequestId: () => "req-1",
});

beforeEach(() => {
    fetchMock.mockReset();
    localStorage.setItem("cafuringa-token", "token-1");
});

describe("sem sinal e pagamento recebido — API", () => {
    it.each([
        ["confirmar sem sinal", waiveDeposit, "waive", "dispensado"],
        [
            "pagamento recebido",
            reportPaymentReceived,
            "received",
            "pagamento-recebido",
        ],
    ] as const)("%s", async (_caso, action, path, situacao) => {
        fetchMock.mockResolvedValue(
            json({ total: 182, sinal: 91, restante: 91, situacao }),
        );

        const payment = await action("b1", { client });

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(
            `http://api.test/api/v1/bookings/received/b1/payment/${path}`,
        );
        expect(init.method).toBe("PATCH");
        expect(payment.status).toBe(situacao);
    });
});
