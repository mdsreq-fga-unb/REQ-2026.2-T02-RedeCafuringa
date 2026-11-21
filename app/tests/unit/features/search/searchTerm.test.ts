import { describe, expect, it } from "vitest";
import {
    MAX_SEARCH_TERM_LENGTH,
    MIN_SEARCH_TERM_LENGTH,
    validateSearchTerm,
} from "@/features/search/searchTerm";

describe("HU36 — validateSearchTerm (CA02, CA08)", () => {
    describe("termo válido (CA02)", () => {
        it("devolve o termo sem espaços nas pontas e sem espaços repetidos", () => {
            expect(validateSearchTerm("  queijo   minas ")).toEqual({
                ok: true,
                term: "queijo minas",
            });
        });

        it("aceita acentos, números e pontuação comum", () => {
            expect(validateSearchTerm("Pão de mel (500 g)")).toEqual({
                ok: true,
                term: "Pão de mel (500 g)",
            });
        });

        it("aceita o tamanho mínimo e o máximo", () => {
            expect(validateSearchTerm("ab").ok).toBe(true);
            expect(
                validateSearchTerm("a".repeat(MAX_SEARCH_TERM_LENGTH)).ok,
            ).toBe(true);
        });
    });

    describe("termo inválido (CA08): explica como corrigir", () => {
        it.each(["", "   ", "\t"])(
            "%j pede que informe o que buscar",
            (valor) => {
                expect(validateSearchTerm(valor)).toEqual({
                    ok: false,
                    reason: "VAZIO",
                    message: "Informe o que você quer buscar.",
                });
            },
        );

        it("curto demais pede mais caracteres", () => {
            expect(MIN_SEARCH_TERM_LENGTH).toBe(2);
            expect(validateSearchTerm(" a ")).toEqual({
                ok: false,
                reason: "CURTO",
                message: "Digite pelo menos 2 caracteres para buscar.",
            });
        });

        it("longo demais informa o limite", () => {
            expect(
                validateSearchTerm("a".repeat(MAX_SEARCH_TERM_LENGTH + 1)),
            ).toEqual({
                ok: false,
                reason: "LONGO",
                message: "A busca deve ter no máximo 100 caracteres.",
            });
        });

        it.each(["%%%", "***", "( )", "...", "caf\u0000e"])(
            "%j é recusado por símbolos ou caracteres de controle",
            (valor) => {
                expect(validateSearchTerm(valor)).toEqual({
                    ok: false,
                    reason: "CARACTERES",
                    message:
                        "Use apenas letras, números e pontuação simples. Remova símbolos especiais e tente de novo.",
                });
            },
        );
    });
});
