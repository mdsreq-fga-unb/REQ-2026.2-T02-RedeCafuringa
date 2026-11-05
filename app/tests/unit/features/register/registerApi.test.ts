import { describe, expect, it } from "vitest";
import type { RegisterPayload } from "@/features/register/registerForm";
import { toCreateProducerBody } from "@/features/register/registerApi";

const payload: RegisterPayload = {
    name: "Horta Comunitária",
    responsible: "Maria da Silva",
    document: "52998224725",
    phone: "61912345678",
    email: "maria@exemplo.com",
    address: "Chácara 12, Núcleo Rural, Brasília - DF",
    category: "Produtos e Experiências",
    paymentMethods: ["Pix", "Dinheiro"],
    password: "senha-segura-1",
};

describe("toCreateProducerBody (contrato CreateProducerDto)", () => {
    it("traduz o payload para o corpo da API, sempre com o CPF do responsável", () => {
        expect(toCreateProducerBody(payload)).toEqual({
            nomeIniciativa: "Horta Comunitária",
            nomeResponsavel: "Maria da Silva",
            cpf: "52998224725",
            localidade: "Chácara 12, Núcleo Rural, Brasília - DF",
            categoriaOfertada: "Produtos e Experiências",
            formasPagamento: ["Pix", "Dinheiro"],
            telefone: "61912345678",
            email: "maria@exemplo.com",
            senha: "senha-segura-1",
        });
    });

    it("HU02 CA03: envia o CNPJ do MEI junto com o CPF", () => {
        const body = toCreateProducerBody({
            ...payload,
            cnpj: "11222333000181",
        });
        expect(body.cnpj).toBe("11222333000181");
        expect(body.cpf).toBe("52998224725");
    });

    it("não envia campos fora do contrato (endereco)", () => {
        expect(toCreateProducerBody(payload)).not.toHaveProperty("endereco");
    });

    it("envia o telefone só com dígitos (campo opcional do contrato)", () => {
        expect(
            toCreateProducerBody({ ...payload, phone: "61912345678" }).telefone,
        ).toBe("61912345678");
    });
});
