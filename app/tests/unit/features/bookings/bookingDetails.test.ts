import { describe, expect, it } from "vitest";
import {
    adaptBookingDetail,
    bookingStatusLabel,
    bookingTotal,
    formatBookingDate,
    formatBookingTime,
    formatParticipants,
    paymentLabel,
    type ApiBookingDetail,
} from "@/features/bookings/bookingDetails";
import type { BookingStatus } from "@/features/bookings/bookingTypes";

const api: ApiBookingDetail = {
    id: "64b0c0ffee0000000000b001",
    experienciaId: "64b0c0ffee0000000000e001",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
    status: "aceita",
    criadoEm: "2026-11-19T13:00:00.000Z",
    atualizadoEm: "2026-11-20T10:00:00.000Z",
    experiencia: {
        nome: "Sabores e caminhos do Cerrado",
        local: "Sítio Raízes",
        valorPorPessoa: 45,
        disponivel: true,
        foto: "/experiences/e001/photos/f1?v=a",
    },
    contraparte: { id: "c1", nome: "Ana Souza" },
};

const normalize = (text: string) => text.replace(/\s/g, " ");

describe("HU45 — adaptBookingDetail (CA04, CA07)", () => {
    it("adapta a solicitação com a experiência, o outro lado e a situação", () => {
        expect(adaptBookingDetail(api, (path) => `https://api${path}`)).toEqual(
            {
                id: "64b0c0ffee0000000000b001",
                experienceId: "64b0c0ffee0000000000e001",
                date: "2026-12-20",
                time: "09:00",
                participants: 2,
                paymentMethod: "pix",
                message: "Gostaríamos de conhecer o sítio.",
                status: "aceita",
                createdAt: "2026-11-19T13:00:00.000Z",
                updatedAt: "2026-11-20T10:00:00.000Z",
                experience: {
                    name: "Sabores e caminhos do Cerrado",
                    local: "Sítio Raízes",
                    pricePerPerson: 45,
                    available: true,
                    photo: "https://api/experiences/e001/photos/f1?v=a",
                },
                counterpart: { id: "c1", name: "Ana Souza" },
            },
        );
    });

    it("omite a mensagem e a foto quando a API não envia", () => {
        const semExtras: ApiBookingDetail = {
            ...api,
            experiencia: { ...api.experiencia },
        };
        delete semExtras.mensagem;
        delete semExtras.experiencia.foto;

        const detail = adaptBookingDetail(semExtras);

        expect("message" in detail).toBe(false);
        expect("photo" in detail.experience).toBe(false);
    });

    it("CA07: usa a situação gravada agora, sem reaproveitar valor antigo", () => {
        expect(adaptBookingDetail({ ...api, status: "cancelada" }).status).toBe(
            "cancelada",
        );
    });
});

describe("HU45 — textos da solicitação", () => {
    it.each<[BookingStatus, string]>([
        ["pendente", "Aguardando resposta"],
        ["aceita", "Aceita pela produtora"],
        ["recusada", "Recusada pela produtora"],
        ["cancelada", "Cancelada"],
    ])("situação %s aparece como %j", (status, label) => {
        expect(bookingStatusLabel(status)).toBe(label);
    });

    it("mostra a data no formato brasileiro, sem deslocar o dia pelo fuso", () => {
        expect(formatBookingDate("2026-12-20")).toBe("20/12/2026");
        expect(formatBookingDate("2027-01-01")).toBe("01/01/2027");
    });

    it("mostra o horário como no protótipo", () => {
        expect(formatBookingTime("09:00")).toBe("09h00");
    });

    it("escreve participantes no singular e no plural", () => {
        expect(formatParticipants(1)).toBe("1 participante");
        expect(formatParticipants(3)).toBe("3 participantes");
    });

    it.each([
        ["pix", "Pix"],
        ["dinheiro", "Dinheiro"],
        ["cartao_credito", "Cartão de crédito"],
        ["cartao_debito", "Cartão de débito"],
    ] as const)("forma de pagamento %s aparece como %j", (method, label) => {
        expect(paymentLabel(method)).toBe(label);
    });

    it("calcula o valor total pelo número de participantes", () => {
        const detail = adaptBookingDetail({
            ...api,
            participantes: 3,
            experiencia: { ...api.experiencia, valorPorPessoa: 45.5 },
        });

        expect(normalize(bookingTotal(detail))).toBe("R$ 136,50");
    });
});
