import { describe, expect, it } from "vitest";
import { toCreateProducerBody } from "@/features/register/registerApi";
import {
    buildRegisterPayload,
    validateRegisterForm,
} from "@/features/register/registerForm";
import type {
    RegisterFormValues,
    RegisterPayload,
} from "@/features/register/registerForm";

// Cadastro sem natureza: quem se cadastra é sempre um produtor, e propriedade
// ou associação são vinculadas ao perfil depois (fora da HU02).
const values = {
    documentType: "cpf",
    birthDate: "10-05-1990",
    name: "Maria da Silva",
    document: "529.982.247-25",
    phone: "(61) 91234-5678",
    email: "Maria@Exemplo.com",
    address: "Chácara 12, Núcleo Rural, Brasília - DF",
    password: "senha-segura-1",
    confirmPassword: "senha-segura-1",
} as RegisterFormValues;

describe("cadastro de produtor sem natureza (HU02, critério 2 revisto)", () => {
    it("aceita o formulário sem natureza", () => {
        expect(validateRegisterForm(values)).toEqual({});
    });

    it("não leva natureza no payload", () => {
        const payload = buildRegisterPayload(values);

        expect(Object.keys(payload)).not.toContain("nature");
    });

    it("não envia natureza no corpo da requisição", () => {
        const payload = buildRegisterPayload(values) as RegisterPayload;

        const body = toCreateProducerBody(payload);

        expect(Object.keys(body)).not.toContain("natureza");
    });
});
