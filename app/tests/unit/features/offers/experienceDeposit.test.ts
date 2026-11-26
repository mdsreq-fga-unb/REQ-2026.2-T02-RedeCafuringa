import { describe, expect, it, vi } from "vitest";
import { registeredToCatalogItem } from "@/features/offers/catalogItems";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const experience = {
    id: "e1",
    nome: "Trilha",
    categoria: "Experiência",
    descricao: "Caminhada.",
    valorPorPessoa: 45.5,
    local: "Sítio",
    duracao: "2 horas",
    fotos: [],
    produtor: { id: "p1", nomeIniciativa: "Sítio Raízes" },
};

describe("experiência — sinal e formas no dia no catálogo", () => {
    it("repassa se exige sinal e as formas aceitas no dia", () => {
        expect(
            registeredToCatalogItem({
                ...experience,
                exigeSinal: false,
                formasPagamentoNoDia: ["dinheiro"],
            }),
        ).toMatchObject({
            requiresDeposit: false,
            dayPaymentMethods: ["dinheiro"],
        });
    });

    it("sem a informação (experiência antiga), exige sinal", () => {
        expect(registeredToCatalogItem(experience).requiresDeposit).toBe(true);
    });
});
