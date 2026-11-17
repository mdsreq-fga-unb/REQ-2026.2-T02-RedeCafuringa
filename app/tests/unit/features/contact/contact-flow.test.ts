import { describe, expect, it } from "vitest";
import {
    createWhatsAppUrl,
    getContactLoginRoute,
    isWhatsAppContactAvailable,
    normalizeWhatsAppNumber,
    toWhatsAppNumber,
    whatsAppContactUrl,
} from "@/features/contact";

describe("regras de contato pelo WhatsApp", () => {
    it("normaliza o número para somente dígitos", () => {
        expect(normalizeWhatsAppNumber("+55 (61) 99999-9999")).toBe(
            "5561999999999",
        );
    });

    it("exige autorização explícita e número válido para exibir o contato", () => {
        expect(isWhatsAppContactAvailable(false, "5561999999999")).toBe(false);
        expect(isWhatsAppContactAvailable(true, "619999999")).toBe(false);
        expect(isWhatsAppContactAvailable(true, "1234567890123456")).toBe(
            false,
        );
        expect(isWhatsAppContactAvailable(true, "5561999999999")).toBe(true);
    });

    it("monta link do WhatsApp com número e mensagem contextual", () => {
        const url = new URL(
            createWhatsAppUrl(
                "+55 (61) 99999-9999",
                "Visita e Degustação de Queijos",
            ),
        );

        expect(url.origin + url.pathname).toBe("https://wa.me/5561999999999");
        expect(url.searchParams.get("text")).toBe(
            "Olá! Encontrei Visita e Degustação de Queijos na Rede Cafuringa e gostaria de tirar uma dúvida.",
        );
    });
});

describe("HU39 — número E.164 a partir do telefone público (CA02)", () => {
    it.each([
        ["61999998888", "5561999998888"],
        ["6133334444", "556133334444"],
        ["(61) 99999-8888", "5561999998888"],
        ["+55 61 99999-8888", "5561999998888"],
        ["5561999998888", "5561999998888"],
    ])("converte %s em %s (DDI 55 quando falta)", (telefone, e164) => {
        expect(toWhatsAppNumber(telefone)).toBe(e164);
    });

    it.each([undefined, "", "   ", "619999", "1234567890123456", "abc"])(
        "recusa telefone ausente ou inválido (%s)",
        (telefone) => {
            expect(toWhatsAppNumber(telefone)).toBeUndefined();
        },
    );

    it("monta o link wa.me só com dígitos e texto codificado", () => {
        const url = whatsAppContactUrl("61999998888", "Mel & Café #1");

        expect(url).toBe(
            `https://wa.me/5561999998888?text=${encodeURIComponent(
                "Olá! Encontrei Mel & Café #1 na Rede Cafuringa e gostaria de tirar uma dúvida.",
            )}`,
        );
    });

    it("CA06: sem telefone válido não há link de contato", () => {
        expect(whatsAppContactUrl(undefined, "Mel")).toBeUndefined();
        expect(whatsAppContactUrl("123", "Mel")).toBeUndefined();
    });
});

describe("HU39/RN17 — login antes de iniciar o contato", () => {
    it("cria a rota de login com a origem do contato codificada", () => {
        expect(getContactLoginRoute("produto/abc")).toBe(
            "/entrar?contato=produto%2Fabc",
        );
        expect(getContactLoginRoute("visita com acento & queijo")).toBe(
            "/entrar?contato=visita%20com%20acento%20%26%20queijo",
        );
    });
});
