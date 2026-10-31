import { describe, expect, it } from "vitest";
import { formatCpf, isValidCpf, onlyDigits } from "@/features/auth/cpf";

describe("onlydigits", () => {
    it("remove tudo que não é dígito", () => {
        expect(onlyDigits("529.982.247-25")).toBe("52998224725");
    });
});

describe("formatcpf", () => {
    it("aplica a máscara progressivamente", () => {
        expect(formatCpf("5299")).toBe("529.9");
        expect(formatCpf("529982")).toBe("529.982");
        expect(formatCpf("5299822")).toBe("529.982.2");
        expect(formatCpf("52998224725")).toBe("529.982.247-25");
    });

    it("ignora letras e dígitos além de 11", () => {
        expect(formatCpf("529a982b247c25999")).toBe("529.982.247-25");
    });
});

describe("isValidCpf", () => {
    it("aceita CPF válido com ou sem máscara", () => {
        expect(isValidCpf("529.982.247-25")).toBe(true);
        expect(isValidCpf("11144477735")).toBe(true);
    });

    it("rejeita CPF com menos ou mais de 11 dígitos", () => {
        expect(isValidCpf("123")).toBe(false);
        expect(isValidCpf("529982247255")).toBe(false);
    });

    it("rejeita CPF com todos os dígitos iguais", () => {
        expect(isValidCpf("111.111.111-11")).toBe(false);
    });

    it("rejeita CPF com dígito verificador errado", () => {
        expect(isValidCpf("529.982.247-24")).toBe(false);
    });
});
