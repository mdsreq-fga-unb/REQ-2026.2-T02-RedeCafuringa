import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    DEMO_BOOKINGS_KEY,
    createMockBooking,
    listMockBookings,
} from "@/features/bookings/mockBookingService";
import type { BookingPayload } from "@/features/bookings/bookingTypes";

const payload: BookingPayload = {
    experienciaId: "64b0c0ffee0000000000e001",
    data: "2026-12-20",
    horario: "09:00",
    participantes: 2,
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
};

describe("mockBookingService (HU44 CA05 e CA06)", () => {
    beforeEach(() => {
        localStorage.clear();
        // Só o Date é falso, para não travar as promises.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-11-19T13:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("registra a pré-reserva associada à experiência com os dados informados", async () => {
        const booking = await createMockBooking(payload);
        expect(booking).toMatchObject({
            experienceId: "64b0c0ffee0000000000e001",
            date: "2026-12-20",
            time: "09:00",
            participants: 2,
            paymentMethod: "pix",
            message: "Gostaríamos de conhecer o sítio.",
            createdAt: "2026-11-19T13:00:00.000Z",
        });
        expect(booking.id).not.toBe("");
    });

    it("cria a pré-reserva como pendente, sem confirmação automática (RN19)", async () => {
        const booking = await createMockBooking(payload);
        expect(booking.status).toBe("pendente");
    });

    it("omite a mensagem quando não foi informada", async () => {
        const withoutMessage: BookingPayload = { ...payload };
        delete withoutMessage.mensagem;
        const booking = await createMockBooking(withoutMessage);
        expect("message" in booking).toBe(false);
    });

    it("grava a pré-reserva na lista de demonstração no formato da API", async () => {
        await createMockBooking(payload);
        expect(listMockBookings()).toEqual([
            {
                id: expect.any(String),
                experienciaId: "64b0c0ffee0000000000e001",
                data: "2026-12-20",
                horario: "09:00",
                participantes: 2,
                formaPagamento: "pix",
                mensagem: "Gostaríamos de conhecer o sítio.",
                status: "pendente",
                criadoEm: "2026-11-19T13:00:00.000Z",
            },
        ]);
    });

    it("dá ids distintos a pré-reservas seguidas e mantém a ordem de criação", async () => {
        const first = await createMockBooking(payload);
        const second = await createMockBooking({
            ...payload,
            experienciaId: "64b0c0ffee0000000000e002",
        });
        expect(second.id).not.toBe(first.id);
        expect(listMockBookings().map((item) => item.experienciaId)).toEqual([
            "64b0c0ffee0000000000e001",
            "64b0c0ffee0000000000e002",
        ]);
    });

    it("devolve lista vazia quando nada foi gravado", () => {
        expect(listMockBookings()).toEqual([]);
    });

    it.each(["não é json", '{"a":1}'])(
        "devolve lista vazia quando o armazenamento está corrompido (%s)",
        (stored) => {
            localStorage.setItem(DEMO_BOOKINGS_KEY, stored);
            expect(listMockBookings()).toEqual([]);
        },
    );

    it("volta a gravar normalmente depois de um armazenamento corrompido", async () => {
        localStorage.setItem(DEMO_BOOKINGS_KEY, "não é json");
        await createMockBooking(payload);
        expect(listMockBookings()).toHaveLength(1);
    });
});