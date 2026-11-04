import { describe, expect, it } from "vitest";
import type { RegisterPayload } from "@/features/register/registerForm";
import { toCreateProducerBody } from "@/features/register/registerApi";

const payload: RegisterPayload = {
    name: "Maria da Silva",
    document: "52998224725",
    phone: "61912345678",
    email: "maria@exemplo.com",
    address: "Chácara 12, Núcleo Rural, Brasília - DF",
    password: "senha-segura-1",
};

describe("toCreateProducerBody", () => {
    it("traduz o payload para o corpo da API em português, usando cpf", () => {
        expect(toCreateProducerBody(payload)).toEqual({
            nome: "Maria da Silva",
            cpf: "52998224725",
            telefone: "61912345678",
            email: "maria@exemplo.com",
            endereco: "Chácara 12, Núcleo Rural, Brasília - DF",
            senha: "senha-segura-1",
        });
    });

    it("usa cnpj, e não cpf, quando o documento tem 14 dígitos", () => {
        const body = toCreateProducerBody({
            ...payload,
            document: "11222333000181",
        });
        expect(body.cnpj).toBe("11222333000181");
        expect(body).not.toHaveProperty("cpf");
    });
});
