import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    bookingDraftStorageKey,
    clearBookingDraft,
    loadBookingDraft,
    saveBookingDraft,
} from "@/features/bookings/bookingDraft";
import type { BookingFormValues } from "@/features/bookings/bookingTypes";

const draft: BookingFormValues = {
    data: "2026-12-20",
    horario: "09:00",
    participantes: "2",
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
};

describe("rascunho da pré-reserva (HU44 CA08, RNF07)", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("cafuringa-user-id", "user-1");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("salva e recupera o rascunho de uma experiência", () => {
        saveBookingDraft("e1", draft);
        expect(loadBookingDraft("e1")).toEqual(draft);
    });

    it("devolve null quando não há rascunho", () => {
        expect(loadBookingDraft("e1")).toBeNull();
    });

    it("não mistura rascunhos de experiências diferentes", () => {
        saveBookingDraft("e1", draft);
        saveBookingDraft("e2", { ...draft, participantes: "5" });
        expect(loadBookingDraft("e1")?.participantes).toBe("2");
        expect(loadBookingDraft("e2")?.participantes).toBe("5");
    });

    it("não mistura rascunhos de usuários diferentes no mesmo aparelho", () => {
        saveBookingDraft("e1", draft);
        localStorage.setItem("cafuringa-user-id", "user-2");
        expect(loadBookingDraft("e1")).toBeNull();
        localStorage.setItem("cafuringa-user-id", "user-1");
        expect(loadBookingDraft("e1")).toEqual(draft);
    });

    it("limpa só o rascunho da experiência indicada", () => {
        saveBookingDraft("e1", draft);
        saveBookingDraft("e2", draft);
        clearBookingDraft("e1");
        expect(loadBookingDraft("e1")).toBeNull();
        expect(loadBookingDraft("e2")).toEqual(draft);
    });

    it.each(["não é json", "[]", "null", '{"a":1}', '{"data":"2026-12-20"}'])(
        "ignora um rascunho corrompido ou incompleto (%s)",
        (stored) => {
            localStorage.setItem(
                bookingDraftStorageKey("e1") as string,
                stored,
            );
            expect(loadBookingDraft("e1")).toBeNull();
        },
    );

    it("descarta campos desconhecidos ao recuperar", () => {
        localStorage.setItem(
            bookingDraftStorageKey("e1") as string,
            JSON.stringify({ ...draft, extra: "x" }),
        );
        expect(loadBookingDraft("e1")).toEqual(draft);
    });

    it("não guarda nem recupera rascunho sem usuário logado", () => {
        localStorage.removeItem("cafuringa-user-id");
        saveBookingDraft("e1", draft);
        expect(loadBookingDraft("e1")).toBeNull();
        expect(
            Object.keys(localStorage).filter((key) =>
                key.startsWith("cafuringa-booking-draft"),
            ),
        ).toEqual([]);
    });

    it("não quebra quando o armazenamento recusa a gravação", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("cheio", "QuotaExceededError");
        });
        expect(() => saveBookingDraft("e1", draft)).not.toThrow();
    });
});
