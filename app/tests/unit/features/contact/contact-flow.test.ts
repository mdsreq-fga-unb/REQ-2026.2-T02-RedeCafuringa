import { describe, expect, it } from "vitest";
import {
    canStartWhatsAppContact,
    createWhatsAppUrl,
    getContactLoginRoute,
    isWhatsAppContactAvailable,
    normalizeWhatsAppNumber,
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

    it("permite iniciar contato somente para consumidor autenticado", () => {
        expect(canStartWhatsAppContact(null, true, "5561999999999")).toBe(
            false,
        );
        expect(canStartWhatsAppContact("producer", true, "5561999999999")).toBe(
            false,
        );
        expect(
            canStartWhatsAppContact("consumer", false, "5561999999999"),
        ).toBe(false);
        expect(canStartWhatsAppContact("consumer", true, "5561999999999")).toBe(
            true,
        );
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

    it("cria rota de login com o assunto codificado", () => {
        expect(getContactLoginRoute("perfil")).toBe("/entrar?contato=perfil");
        expect(getContactLoginRoute("visita com acento & queijo")).toBe(
            "/entrar?contato=visita%20com%20acento%20%26%20queijo",
        );
    });
});
