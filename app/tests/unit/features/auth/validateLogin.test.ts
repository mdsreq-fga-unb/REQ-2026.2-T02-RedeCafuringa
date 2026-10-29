import { describe, expect, it } from "vitest";
import { validateLogin } from "@/features/auth/validateLogin";

describe("validateLogin", () => {
    it("não retorna erros com CPF válido e senha preenchida", () => {
        expect(
            validateLogin({ cpf: "529.982.247-25", password: "senha123" }),
        ).toEqual({});
    });

    it("sinaliza CPF e senha vazios", () => {
        expect(validateLogin({ cpf: "", password: "" })).toEqual({
            cpf: "Informe o CPF.",
            password: "Informe a senha.",
        });
    });

    it("sinaliza CPF com formato inválido", () => {
        expect(validateLogin({ cpf: "123", password: "x" })).toEqual({
            cpf: "CPF com formato inválido.",
        });
        expect(validateLogin({ cpf: "111.111.111-11", password: "x" })).toEqual(
            { cpf: "CPF com formato inválido." },
        );
    });
});