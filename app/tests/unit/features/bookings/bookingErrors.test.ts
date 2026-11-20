import { describe, expect, it } from "vitest";
import { describeBookingError } from "@/features/bookings/bookingErrors";

const apiError = (status: number) =>
    Object.assign(new Error(`HTTP ${status}`), { status });

const SEND_FAILED =
    "Não foi possível enviar a pré-reserva. Seus dados foram mantidos, tente novamente.";

describe("describeBookingError (HU44 CA08)", () => {
    it.each([
        [400, "Confira os dados da pré-reserva e tente novamente."],
        [
            401,
            "Sua sessão expirou. Entre novamente para solicitar a pré-reserva.",
        ],
        [403, "Seu perfil não pode solicitar pré-reservas."],
        [404, "Esta experiência não está mais disponível para pré-reserva."],
        [
            429,
            "Muitas tentativas seguidas. Aguarde um instante e tente de novo.",
        ],
    ])("explica a falha %i", (status, message) => {
        expect(describeBookingError(apiError(status))).toBe(message);
    });

    it.each([500, 502, 503])(
        "informa que a operação não foi concluída em erro do servidor (%i)",
        (status) => {
            expect(describeBookingError(apiError(status))).toBe(SEND_FAILED);
        },
    );

    it("informa que a operação não foi concluída quando não há conexão", () => {
        expect(describeBookingError(new TypeError("Failed to fetch"))).toBe(
            SEND_FAILED,
        );
    });

    it.each(["falhou", null, undefined])(
        "usa a mensagem geral para um erro desconhecido (%j)",
        (error) => {
            expect(describeBookingError(error)).toBe(SEND_FAILED);
        },
    );
});
