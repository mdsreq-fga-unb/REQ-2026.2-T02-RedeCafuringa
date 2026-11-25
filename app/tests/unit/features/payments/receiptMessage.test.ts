import { describe, expect, it } from "vitest";
import {
    receiptMessage,
    receiptWhatsAppUrl,
} from "@/features/payments/receiptMessage";

const message = receiptMessage({
    depositCents: 9100,
    experienceName: "Sabores e caminhos do Cerrado",
    date: "2026-12-20",
});

describe("comprovante do sinal pelo WhatsApp", () => {
    it("a mensagem diz o valor, a experiência e a data", () => {
        expect(message).toBe(
            "Olá! Paguei o sinal de R$ 91,00 da pré-reserva de Sabores e caminhos do Cerrado para 20/12/2026. Segue o comprovante.",
        );
    });

    it.each([
        ["61999998888", "5561999998888"],
        ["(61) 3333-4444", "556133334444"],
        ["5561999998888", "5561999998888"],
    ])("abre a conversa com %s no WhatsApp", (phone, digits) => {
        expect(receiptWhatsAppUrl(phone, message)).toBe(
            `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
        );
    });

    it.each([undefined, "", "123"])(
        "sem telefone válido (%j), não há link",
        (phone) => {
            expect(receiptWhatsAppUrl(phone, message)).toBeUndefined();
        },
    );
});
