import { describe, expect, it } from "vitest";
import {
    adaptBookingDetail,
    formatDepositDeadline,
    type ApiBookingDetail,
} from "@/features/bookings/bookingDetails";

const api = {
    id: "65f0c0ffee0000000000abcd",
    experienciaId: "e1",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 4,
    formaPagamento: "pix",
    status: "aceita",
    criadoEm: "2026-11-21T13:00:00.000Z",
    atualizadoEm: "2026-11-21T13:30:00.000Z",
    experiencia: {
        nome: "Trilha",
        local: "Sítio",
        valorPorPessoa: 45.5,
        disponivel: true,
    },
    contraparte: { id: "p1", nome: "Sítio Raízes" },
} as ApiBookingDetail;

const pagamento = {
    total: 182,
    sinal: 91,
    restante: 91,
    situacao: "aguardando-sinal",
    prazoSinal: "2026-11-22T13:30:00.000Z",
};
const pix = {
    chave: "+5561999998888",
    nomeRecebedor: "Maria da Silva",
    cidade: "BRASILIA",
    txid: "65f0c0ffee0000000000abcd",
};

describe("pré-reserva — pagamento no adaptador", () => {
    it("converte o pagamento para centavos, sem erro de arredondamento", () => {
        const detail = adaptBookingDetail({
            ...api,
            pagamento: {
                ...pagamento,
                total: 136.5,
                sinal: 68.25,
                restante: 68.25,
            },
        } as ApiBookingDetail);

        expect(detail.payment).toEqual({
            totalCents: 13650,
            depositCents: 6825,
            remainingCents: 6825,
            status: "aguardando-sinal",
            depositDeadline: "2026-11-22T13:30:00.000Z",
        });
    });

    it("traz o Pix da produtora quando a API manda", () => {
        const detail = adaptBookingDetail({
            ...api,
            pagamento,
            pix,
        } as ApiBookingDetail);

        expect(detail.pix).toEqual({
            key: "+5561999998888",
            receiver: "Maria da Silva",
            city: "BRASILIA",
            txid: "65f0c0ffee0000000000abcd",
        });
    });

    it("sem pagamento nem Pix, os campos não aparecem", () => {
        const detail = adaptBookingDetail(api);

        expect(detail).not.toHaveProperty("payment");
        expect(detail).not.toHaveProperty("pix");
    });
});

describe("pré-reserva — prazo do sinal", () => {
    it("mostra o prazo no horário de Brasília", () => {
        expect(formatDepositDeadline("2026-11-22T13:30:00.000Z")).toBe(
            "22/11/2026 às 10h30",
        );
    });
});
