import { describe, expect, it } from "vitest";
import {
    PixCodeError,
    buildPixCode,
    crc16,
    isNormalizedPixKey,
    normalizePixKey,
} from "@/features/payments/pixCode";

/** Códigos conferidos com uma implementação independente do BR Code. */
const EMAIL_CODE =
    "00020126390014br.gov.bcb.pix0117maria@exemplo.com520400005303986540545.005802BR5914HORTA DA MARIA6008BRASILIA62120508PR1A2B3C63044122";
const PHONE_CODE =
    "00020126360014br.gov.bcb.pix0114+55619999988885204000053039865802BR5914HORTA DA MARIA6008BRASILIA62070503***6304075A";

const base = { nome: "Horta da Maria", cidade: "Brasília" };

describe("Pix — crc16", () => {
    it("usa o CRC16-CCITT do BR Code (valor de referência 29B1)", () => {
        expect(crc16("123456789")).toBe("29B1");
    });

    it("sempre devolve 4 dígitos hexadecimais em maiúsculas", () => {
        expect(crc16("")).toBe("FFFF");
        expect(crc16("a")).toMatch(/^[0-9A-F]{4}$/);
    });
});

describe("Pix — buildPixCode", () => {
    it("monta o código com valor e identificador da pré-reserva", () => {
        expect(
            buildPixCode({
                ...base,
                chave: "maria@exemplo.com",
                valorCentavos: 4500,
                txid: "PR1A2B3C",
            }),
        ).toBe(EMAIL_CODE);
    });

    it("sem valor nem identificador, a pessoa digita o valor no banco", () => {
        expect(buildPixCode({ ...base, chave: "+5561999998888" })).toBe(
            PHONE_CODE,
        );
    });

    it("nome e cidade vão sem acento, em maiúsculas e no tamanho máximo", () => {
        const code = buildPixCode({
            chave: "maria@exemplo.com",
            nome: "Sítio São João da Conceição Ltda",
            cidade: "São Sebastião do Paraíso",
        });

        expect(code).toContain("5925SITIO SAO JOAO DA CONCEIC");
        expect(code).toContain("6015SAO SEBASTIAO D");
    });

    it.each([
        [1, "0.01"],
        [4550, "45.50"],
        [123456, "1234.56"],
    ])("valor de %i centavos vira %s", (valorCentavos, texto) => {
        const code = buildPixCode({
            ...base,
            chave: "maria@exemplo.com",
            valorCentavos,
        });

        expect(code).toContain(
            `54${String(texto.length).padStart(2, "0")}${texto}`,
        );
    });

    it("o identificador fica só com letras e números, até 25", () => {
        const code = buildPixCode({
            ...base,
            chave: "maria@exemplo.com",
            txid: "pr-65f0c0ffee0000000000abcd!!",
        });

        expect(code).toContain("62290525pr65f0c0ffee0000000000abc6304");
    });

    it("o código termina com o verificador do próprio conteúdo", () => {
        const code = buildPixCode({ ...base, chave: "maria@exemplo.com" });

        expect(code.slice(-8, -4)).toBe("6304");
        expect(code.slice(-4)).toBe(crc16(code.slice(0, -4)));
    });

    it.each([
        ["chave vazia", { chave: "  " }],
        ["chave inválida", { chave: "não é chave" }],
        ["chave sem normalizar", { chave: "(61) 99999-8888" }],
        ["nome vazio", { nome: "  " }],
        ["cidade vazia", { cidade: "" }],
        ["valor negativo", { valorCentavos: -1 }],
        ["valor zero", { valorCentavos: 0 }],
        ["valor fracionado", { valorCentavos: 10.5 }],
    ])("recusa %s", (_caso, override) => {
        expect(() =>
            buildPixCode({ ...base, chave: "maria@exemplo.com", ...override }),
        ).toThrow(PixCodeError);
    });
});

describe("Pix — normalizePixKey", () => {
    it.each([
        ["telefone", "(61) 99999-8888", "+5561999998888"],
        ["telefone", "61 3333-4444", "+556133334444"],
        ["telefone", "+55 61 99999-8888", "+5561999998888"],
        ["cpf", "529.982.247-25", "52998224725"],
        ["cnpj", "11.222.333/0001-81", "11222333000181"],
        ["email", "  Maria@Exemplo.COM ", "maria@exemplo.com"],
        [
            "aleatoria",
            "123E4567-E89B-12D3-A456-426614174000",
            "123e4567-e89b-12d3-a456-426614174000",
        ],
    ] as const)("%s %s vira %s", (tipo, valor, esperado) => {
        expect(normalizePixKey(tipo, valor)).toBe(esperado);
    });

    it.each([
        ["telefone", ""],
        ["telefone", "999"],
        ["telefone", "+1 202 555 0100"],
        ["cpf", "529.982.247-26"],
        ["cpf", "11111111111"],
        ["cnpj", "11.222.333/0001-82"],
        ["email", "maria@"],
        ["email", "maria exemplo@x.com"],
        ["aleatoria", "123e4567-e89b-12d3-a456"],
    ] as const)("recusa %s %j", (tipo, valor) => {
        expect(normalizePixKey(tipo, valor)).toBeNull();
    });
});

describe("Pix — isNormalizedPixKey", () => {
    it.each([
        "+5561999998888",
        "52998224725",
        "11222333000181",
        "maria@exemplo.com",
        "123e4567-e89b-12d3-a456-426614174000",
    ])("aceita a chave já normalizada %s", (chave) => {
        expect(isNormalizedPixKey(chave)).toBe(true);
    });

    it.each([
        "",
        "(61) 99999-8888",
        "529.982.247-25",
        "Maria@Exemplo.com",
        "abc",
    ])("recusa %j", (chave) => {
        expect(isNormalizedPixKey(chave)).toBe(false);
    });
});
