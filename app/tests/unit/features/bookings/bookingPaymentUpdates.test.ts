import { describe, expect, it } from "vitest";
import {
    bookingUpdateId,
    bookingUpdateLabel,
    toBookingUpdates,
} from "@/features/bookings/bookingNotificationsService";

const base = {
    id: "r1:aceita:aguardando-sinal",
    reservaId: "r1",
    codigo: "CAF-000001",
    experienciaNome: "Trilha",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    status: "aceita" as const,
};

describe("notificações do sinal — id da atualização", () => {
    it.each([
        [{ id: "r1", status: "aceita" as const }, "r1:aceita"],
        [
            {
                id: "r1",
                status: "aceita" as const,
                payment: { status: "comprovante-enviado" as const },
            },
            "r1:aceita:comprovante-enviado",
        ],
        [
            {
                id: "r1",
                status: "cancelada" as const,
                payment: {
                    status: "sinal-confirmado" as const,
                    refund: "pendente" as const,
                },
            },
            "r1:cancelada:sinal-confirmado:pendente",
        ],
    ])("%j vira %s, igual à API", (booking, id) => {
        expect(bookingUpdateId(booking)).toBe(id);
    });
});

describe("notificações do sinal — texto", () => {
    it.each([
        [
            "consumer",
            { pagamento: "aguardando-sinal" },
            "Aceito: pague o sinal",
        ],
        [
            "producer",
            { pagamento: "aguardando-sinal" },
            "Aceito: aguardando o sinal",
        ],
        [
            "consumer",
            { pagamento: "comprovante-enviado" },
            "Comprovante enviado",
        ],
        [
            "producer",
            { pagamento: "comprovante-enviado" },
            "Confira o pagamento do sinal",
        ],
        ["consumer", { pagamento: "sinal-confirmado" }, "Sinal confirmado"],
        ["consumer", { pagamento: "expirado" }, "Prazo do sinal vencido"],
        ["consumer", { pagamento: "dispensado" }, "Aceito sem sinal"],
        ["producer", { pagamento: "pagamento-recebido" }, "Pagamento recebido"],
        [
            "producer",
            {
                status: "cancelada",
                pagamento: "sinal-confirmado",
                devolucao: "pendente",
            },
            "Cancelado: devolva o sinal",
        ],
        [
            "consumer",
            {
                status: "cancelada",
                pagamento: "sinal-confirmado",
                devolucao: "pendente",
            },
            "Cancelado: devolução do sinal pendente",
        ],
        [
            "consumer",
            {
                status: "cancelada",
                pagamento: "sinal-confirmado",
                devolucao: "feita",
            },
            "Sinal devolvido",
        ],
        [
            "consumer",
            {
                status: "cancelada",
                pagamento: "sinal-confirmado",
                devolucao: "retido",
            },
            "Cancelado: sinal retido",
        ],
        ["consumer", { status: "recusada" }, "Recusado"],
        ["consumer", {}, "Aceito"],
    ] as const)("%s, %j: %s", (role, extra, label) => {
        expect(
            bookingUpdateLabel(
                { ...base, nova: true, ...extra } as never,
                role,
            ),
        ).toBe(label);
    });
});

describe("notificações do sinal — validação da lista", () => {
    it("mantém o sinal e a devolução que a API mandou", () => {
        const [item] = toBookingUpdates([
            {
                ...base,
                status: "cancelada",
                pagamento: "sinal-confirmado",
                devolucao: "pendente",
            },
        ]);

        expect(item).toMatchObject({
            pagamento: "sinal-confirmado",
            devolucao: "pendente",
            nova: true,
        });
    });

    it("sem sinal, a notificação fica como antes", () => {
        const [item] = toBookingUpdates([{ ...base, id: "r1:aceita" }]);

        expect(item).not.toHaveProperty("pagamento");
        expect(item).not.toHaveProperty("devolucao");
    });

    it.each([{ pagamento: "pago-em-bitcoin" }, { devolucao: "talvez" }])(
        "recusa valor desconhecido %j",
        (extra) => {
            expect(() => toBookingUpdates([{ ...base, ...extra }])).toThrow(
                "Notificação inválida.",
            );
        },
    );
});
