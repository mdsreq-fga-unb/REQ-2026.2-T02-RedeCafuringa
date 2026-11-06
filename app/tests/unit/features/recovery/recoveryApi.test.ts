import { describe, expect, it } from "vitest";
import {
    toRecoverAccessBody,
    toResetPasswordBody,
} from "@/features/recovery/recoveryApi";

describe("recoveryApi — contrato da HU10", () => {
    it("normaliza o e-mail da solicitação (sem espaços e em minúsculas)", () => {
        expect(toRecoverAccessBody({ email: "  Ana@Exemplo.COM " })).toEqual({
            email: "ana@exemplo.com",
        });
    });

    it("monta o corpo da redefinição com token e novaSenha", () => {
        expect(
            toResetPasswordBody({ token: "abc123", password: "novaSenha1" }),
        ).toEqual({ token: "abc123", novaSenha: "novaSenha1" });
    });

    it("remove espaços das pontas do token", () => {
        expect(
            toResetPasswordBody({ token: "  abc123  ", password: "novaSenha1" }),
        ).toEqual({ token: "abc123", novaSenha: "novaSenha1" });
    });

    it("mantém a senha exatamente como foi digitada", () => {
        expect(
            toResetPasswordBody({ token: "abc123", password: " Senha 1 " }),
        ).toEqual({ token: "abc123", novaSenha: " Senha 1 " });
    });
});