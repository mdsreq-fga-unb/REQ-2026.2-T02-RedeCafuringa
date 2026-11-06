import { describe, expect, it } from "vitest";
import { validateRecoveryRequest } from "@/features/recovery/recoveryValidation";

describe("validateRecoveryRequest — HU10 CA02 e CA06", () => {
    it("aceita um e-mail válido", () => {
        expect(validateRecoveryRequest({ email: "ana@exemplo.com" })).toEqual(
            {},
        );
    });

    it("ignora espaços nas pontas do e-mail", () => {
        expect(
            validateRecoveryRequest({ email: "  ana@exemplo.com  " }),
        ).toEqual({});
    });

    it("exige o e-mail", () => {
        expect(validateRecoveryRequest({ email: "   " })).toEqual({
            email: "Informe o e-mail.",
        });
    });

    it("rejeita e-mail com formato inválido", () => {
        expect(validateRecoveryRequest({ email: "ana@" })).toEqual({
            email: "E-mail com formato inválido.",
        });
    });
});