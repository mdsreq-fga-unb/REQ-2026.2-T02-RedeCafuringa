import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingSessionError } from "@/features/bookings/bookingService";
import { createMockBooking } from "@/features/bookings/mockBookingService";
import {
    getBooking,
    listMyBookings,
    listReceivedBookings,
} from "@/features/bookings/bookingQueryService";
import { saveDemoOffer } from "@/features/offers/publishedOffers";
import type { BookingPayload } from "@/features/bookings/bookingTypes";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

/** Experiência fictícia da demonstração (listExperiences), de Jefferson Sooma. */
const QUEIJOS = "queijos";
/** Experiência cadastrada no navegador pela produtora de teste (id 2). */
const TRILHA = "demo-experience-trilha";

const payload = (
    experienciaId: string,
    data = "2026-12-20",
): BookingPayload => ({
    experienciaId,
    data,
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
});

function signInAs(role: "consumer" | "producer", id: string, name: string) {
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-user-id", id);
    localStorage.setItem("cafuringa-name", name);
    localStorage.setItem("cafuringa-token", `demo-${id}`);
}

/** A consumidora envia a pré-reserva pela HU44, como na demonstração. */
async function requestAs(
    id: string,
    name: string,
    experienciaId: string,
    data?: string,
) {
    signInAs("consumer", id, name);
    return createMockBooking(payload(experienciaId, data));
}

beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.useRealTimers();
    saveDemoOffer({
        id: TRILHA,
        nome: "Trilha da nascente",
        categoria: "Experiência",
        descricao: "Caminhada até a nascente.",
        valorPorPessoa: 30,
        local: "Sítio Flor do campo",
        duracao: "2 horas",
        fotos: [],
        produtor: { id: "2", nomeIniciativa: "Flor do campo" },
        disponivel: true,
    });
});

describe("HU45 — consulta na demonstração: consumidora (CA02, CA06)", () => {
    it("lista as pré-reservas que ela enviou, com os dados da experiência", async () => {
        const enviada = await requestAs("1", "Ana", QUEIJOS);

        const result = await listMyBookings();

        expect(result.total).toBe(1);
        expect(result.items[0]).toMatchObject({
            id: enviada.id,
            status: "pendente",
            date: "2026-12-20",
            participants: 2,
            experience: {
                name: "Visita e Degustação de Queijos",
                local: "Cafuringa, DF",
                pricePerPerson: 45,
                available: true,
            },
            counterpart: { name: "Jefferson Sooma" },
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("não mostra as pré-reservas de outra consumidora", async () => {
        await requestAs("9", "Bia", QUEIJOS);
        const minha = await requestAs("1", "Ana", TRILHA);

        const result = await listMyBookings();

        expect(result.items.map((item) => item.id)).toEqual([minha.id]);
    });

    it("mostra a mais nova primeiro", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-11-20T10:00:00Z"));
        const antiga = await requestAs("1", "Ana", QUEIJOS);
        vi.setSystemTime(new Date("2026-11-21T10:00:00Z"));
        const nova = await requestAs("1", "Ana", TRILHA);

        const result = await listMyBookings();

        expect(result.items.map((item) => item.id)).toEqual([
            nova.id,
            antiga.id,
        ]);
    });

    it("CA06: sem pré-reservas devolve lista vazia", async () => {
        signInAs("consumer", "1", "Ana");

        await expect(listMyBookings()).resolves.toEqual({
            items: [],
            total: 0,
        });
    });
});

describe("HU45 — consulta na demonstração: produtora (CA03)", () => {
    it("lista só as recebidas para as experiências dela, com o nome da consumidora", async () => {
        const paraEla = await requestAs("1", "Ana", TRILHA);
        await requestAs("1", "Ana", QUEIJOS);
        signInAs("producer", "2", "Flor do campo");

        const result = await listReceivedBookings();

        expect(result.items.map((item) => item.id)).toEqual([paraEla.id]);
        expect(result.items[0]).toMatchObject({
            experience: { name: "Trilha da nascente", pricePerPerson: 30 },
            counterpart: { id: "1", name: "Ana" },
        });
    });
});

describe("HU45 — detalhe na demonstração (CA04, CA05)", () => {
    it("a consumidora abre a própria pré-reserva", async () => {
        const enviada = await requestAs("1", "Ana", QUEIJOS);

        const detail = await getBooking(enviada.id);

        expect(detail).toMatchObject({
            id: enviada.id,
            status: "pendente",
            experience: { name: "Visita e Degustação de Queijos" },
        });
    });

    it("CA05: a consumidora não abre a pré-reserva de outra conta", async () => {
        const alheia = await requestAs("9", "Bia", QUEIJOS);
        signInAs("consumer", "1", "Ana");

        await expect(getBooking(alheia.id)).resolves.toBeNull();
    });

    it("a produtora abre a recebida para a experiência dela", async () => {
        const paraEla = await requestAs("1", "Ana", TRILHA);
        signInAs("producer", "2", "Flor do campo");

        await expect(getBooking(paraEla.id)).resolves.toMatchObject({
            id: paraEla.id,
            counterpart: { name: "Ana" },
        });
    });

    it("CA05: a produtora não abre pré-reserva de experiência de outra produtora", async () => {
        const deOutra = await requestAs("1", "Ana", QUEIJOS);
        signInAs("producer", "2", "Flor do campo");

        await expect(getBooking(deOutra.id)).resolves.toBeNull();
    });

    it("id inexistente devolve null", async () => {
        signInAs("consumer", "1", "Ana");

        await expect(getBooking("nao-existe")).resolves.toBeNull();
    });
});

describe("HU45 — sessão na demonstração", () => {
    it.each([
        ["listMyBookings", () => listMyBookings()],
        ["listReceivedBookings", () => listReceivedBookings()],
        ["getBooking", () => getBooking("qualquer")],
    ])("%s sem sessão falha como sessão ausente", async (_nome, call) => {
        await expect(call()).rejects.toBeInstanceOf(BookingSessionError);
    });
});
