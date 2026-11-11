import { describe, expect, it } from "vitest";
import { validateLogin } from "@/features/auth/validateLogin";

describe("validateLogin", () => {
    it("não retorna erros com e-mail válido e senha preenchida", () => {
        expect(
            validateLogin({ email: "ana@exemplo.com", password: "senha123" }),
        ).toEqual({});
    });

    it("sinaliza e-mail e senha vazios", () => {
        expect(validateLogin({ email: "", password: "" })).toEqual({
            email: "Informe o e-mail.",
            password: "Informe a senha.",
        });
    });

    it("sinaliza e-mail com formato inválido", () => {
        expect(validateLogin({ email: "ana@", password: "x" })).toEqual({
            email: "E-mail com formato inválido.",
        });
        expect(validateLogin({ email: "sem-arroba", password: "x" })).toEqual({
            email: "E-mail com formato inválido.",
        });
    });
});
