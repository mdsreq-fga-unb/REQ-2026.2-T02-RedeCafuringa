import { describe, expect, it } from "vitest";
import { formatCpf, isValidCpf, onlyDigits } from "@/features/auth/cpf";

describe("onlydigits", () => {
    it("remove tudo que não é dígito", () => {
        expect(onlyDigits("529.982.247-25")).toBe("52998224725")
    })
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
})