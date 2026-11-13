import { describe, expect, it } from "vitest";
import { toProductDetails } from "@/features/offers/productDetailsAdapter";
import type { ApiProductDetails } from "@/features/offers/productTypes";

const apiMel: ApiProductDetails = {
    id: "mel",
    nome: "Mel do Cerrado",
    produtor: "Dona Maria",
    preco: 32,
    unidade: "unidade",
    imagemUrl: "/images/mel.jpg",
    disponivel: true,
    descricao: "Mel produzido no território da Cafuringa.",
    medida: "500 g",
    whatsapp: "5561999999999",
};

describe("toProductDetails", () => {
    it("mapeia os campos públicos para o modelo do front", () => {
        expect(toProductDetails(apiMel)).toEqual({
            id: "mel",
            name: "Mel do Cerrado",
            producerName: "Dona Maria",
            price: 32,
            unit: "unidade",
            image: "/images/mel.jpg",
            available: true,
            description: "Mel produzido no território da Cafuringa.",
            measure: "500 g",
            whatsapp: "5561999999999",
        });
    });

    it("mantém o produto indisponível em vez de descartá-lo", () => {
        const result = toProductDetails({ ...apiMel, disponivel: false });
        expect(result.available).toBe(false);
        expect(result.name).toBe("Mel do Cerrado");
    });

    it("ignora campos privados que a API enviar por engano", () => {
        const result = toProductDetails({
            ...apiMel,
            cpf: "12345678909",
            email: "dona.maria@exemplo.com",
            telefone: "61988887777",
        } as ApiProductDetails);

        expect(Object.keys(result).sort()).toEqual([
            "available",
            "description",
            "id",
            "image",
            "measure",
            "name",
            "price",
            "producerName",
            "unit",
            "whatsapp",
        ]);
    });

    it("deixa descrição, medida e WhatsApp indefinidos quando ausentes", () => {
        const { descricao, medida, whatsapp, ...semOpcionais } = apiMel;
        const result = toProductDetails(semOpcionais);

        expect(result.description).toBeUndefined();
        expect(result.measure).toBeUndefined();
        expect(result.whatsapp).toBeUndefined();
    });

    it("trata campos opcionais em branco como ausentes", () => {
        const result = toProductDetails({
            ...apiMel,
            descricao: "   ",
            medida: "",
            whatsapp: " ",
        });

        expect(result.description).toBeUndefined();
        expect(result.measure).toBeUndefined();
        expect(result.whatsapp).toBeUndefined();
    });
});