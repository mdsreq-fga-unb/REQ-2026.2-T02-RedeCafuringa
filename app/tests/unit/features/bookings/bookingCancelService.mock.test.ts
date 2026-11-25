import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingSessionError } from "@/features/bookings/bookingService";
import {
    BookingCancelError,
    cancelBooking,
} from "@/features/bookings/bookingCancelService";
import { getBooking } from "@/features/bookings/bookingQueryService";
import {
    createMockBooking,
    DEMO_BOOKINGS_KEY,
    listMockBookings,
} from "@/features/bookings/mockBookingService";
import type { BookingStatus } from "@/features/bookings/bookingTypes";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function signInAs(role: "consumer" | "producer", id: string, name: string) {
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-user-id", id);
    localStorage.setItem("cafuringa-name", name);
    localStorage.setItem("cafuringa-token", `demo-${id}`);
}

/** A consumidora envia a pré-reserva pela HU44 (experiência fictícia "queijos"). */
async function requestAs(id: string, name: string) {
    signInAs("consumer", id, name);
    return createMockBooking({
        experienciaId: "queijos",
        data: "2026-12-20",
        horario: "09:00",
        participantes: 2,
        formaPagamento: "pix",
    });
}

/** Simula a resposta da produtora (HU47) direto nos dados da demonstração. */
function setStatus(id: string, status: BookingStatus) {
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify(
            listMockBookings().map((item) =>
                item.id === id ? { ...item, status } : item,
            ),
        ),
    );
}

const statusOf = (id: string) =>
    listMockBookings().find((item) => item.id === id)?.status;

const failure = (call: Promise<unknown>) =>
    call.then(
        () => {
            throw new Error("deveria ter falhado");
        },
        (error: unknown) => error,
    );

beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.useRealTimers();
});

describe("HU46 — cancelamento na demonstração", () => {
    it("CA03, CA06: a dona cancela a pendente e a consulta mostra a situação nova", async () => {
        const enviada = await requestAs("1", "Ana");
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-11-22T15:00:00.000Z"));

        const booking = await cancelBooking(enviada.id);

        expect(booking).toMatchObject({ id: enviada.id, status: "cancelada" });
        expect(statusOf(enviada.id)).toBe("cancelada");
        expect(await getBooking(enviada.id)).toMatchObject({
            status: "cancelada",
            updatedAt: "2026-11-22T15:00:00.000Z",
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("CA05: não cancela a pré-reserva de outra conta", async () => {
        const alheia = await requestAs("9", "Bia");
        signInAs("consumer", "1", "Ana");

        const error = await failure(cancelBooking(alheia.id));

        expect(error).toBeInstanceOf(BookingCancelError);
        expect((error as BookingCancelError).reason).toBe("nao-encontrada");
        expect(statusOf(alheia.id)).toBe("pendente");
    });

    it("id inexistente é 'não encontrada'", async () => {
        signInAs("consumer", "1", "Ana");

        const error = await failure(cancelBooking("nao-existe"));

        expect((error as BookingCancelError).reason).toBe("nao-encontrada");
    });

    // RN20 revista em 25/11/2026: a aceita também se cancela.
    it.each<[BookingStatus, string]>([
        [
            "recusada",
            "Esta pré-reserva foi recusada pelo produtor e não pode ser cancelada",
        ],
        ["cancelada", "Esta pré-reserva já foi cancelada"],
    ])(
        "RN20: %s não pode ser cancelada pela consumidora e não muda",
        async (status, message) => {
            const enviada = await requestAs("1", "Ana");
            setStatus(enviada.id, status);

            const error = await failure(cancelBooking(enviada.id));

            expect(error).toBeInstanceOf(BookingCancelError);
            expect((error as BookingCancelError).reason).toBe("nao-cancelavel");
            expect((error as BookingCancelError).message).toBe(message);
            expect(statusOf(enviada.id)).toBe(status);
        },
    );

    it("sem sessão falha como sessão ausente", async () => {
        await expect(cancelBooking("qualquer")).rejects.toBeInstanceOf(
            BookingSessionError,
        );
    });
});
