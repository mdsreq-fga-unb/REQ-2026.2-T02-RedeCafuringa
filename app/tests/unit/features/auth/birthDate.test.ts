import { describe, expect, it } from "vitest";
import { toIsoBirthDate } from "@/features/auth/birthDate";

describe("toIsoBirthDate", () => {
    it("converte DD-MM-AAAA do formulário para AAAA-MM-DD da API", () => {
        expect(toIsoBirthDate("10-05-1990")).toBe("1990-05-10");
    });

    it("devolve undefined para data inválida", () => {
        expect(toIsoBirthDate("31-02-1990")).toBeUndefined();
        expect(toIsoBirthDate("")).toBeUndefined();
    });
});
