import { describe, expect, it } from "vitest";
import { validateNewPassword } from "@/features/recovery/recoveryValidation";

describe("validateNewPassword — HU10 CA04 e CA06", () => {
    it("aceita senha válida com confirmação igual", () => {
        expect(
            validateNewPassword({
                password: "novaSenha1",
                confirmPassword: "novaSenha1",
            }),
        ).toEqual({});
    });

    it("exige a nova senha", () => {
        expect(
            validateNewPassword({ password: "", confirmPassword: "" }),
        ).toMatchObject({ password: "Informe a nova senha." });
    });

    it("rejeita senha com menos de 8 caracteres", () => {
        expect(
            validateNewPassword({
                password: "abc123",
                confirmPassword: "abc123",
            }),
        ).toEqual({ password: "A senha deve ter no mínimo 8 caracteres." });
    });

    it("rejeita senha com mais de 128 caracteres", () => {
        const longPassword = `a1${"x".repeat(127)}`;
        expect(
            validateNewPassword({
                password: longPassword,
                confirmPassword: longPassword,
            }),
        ).toEqual({ password: "A senha deve ter no máximo 128 caracteres." });
    });

    it("exige letras e números na senha", () => {
        expect(
            validateNewPassword({
                password: "abcdefgh",
                confirmPassword: "abcdefgh",
            }),
        ).toEqual({ password: "A senha deve ter letras e números." });
    });

    it("exige a confirmação da senha", () => {
        expect(
            validateNewPassword({
                password: "novaSenha1",
                confirmPassword: "",
            }),
        ).toEqual({ confirmPassword: "Confirme a nova senha." });
    });

    it("rejeita confirmação diferente da senha", () => {
        expect(
            validateNewPassword({
                password: "novaSenha1",
                confirmPassword: "novaSenha2",
            }),
        ).toEqual({ confirmPassword: "As senhas não conferem." });
    });
});
