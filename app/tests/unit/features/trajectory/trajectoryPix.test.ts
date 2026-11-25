import { describe, expect, it } from "vitest";
import {
    emptyTrajectory,
    trajectoryBody,
    validateTrajectory,
} from "@/features/trajectory/trajectoryModel";
import type { TrajectoryDraft } from "@/features/trajectory/trajectoryModel";

function draft(overrides: Partial<TrajectoryDraft> = {}): TrajectoryDraft {
    return {
        ...emptyTrajectory,
        story: "História da horta",
        activities: "Visitas",
        ...overrides,
    };
}

const pix = {
    pixType: "telefone" as const,
    pixKey: "(61) 99999-8888",
    pixReceiver: "Maria da Silva",
    pixPublic: true,
};

describe("trajetória — Pix no modelo", () => {
    it("começa sem Pix", () => {
        expect(emptyTrajectory).toMatchObject({
            pixType: "",
            pixKey: "",
            pixReceiver: "",
            pixPublic: false,
            hadPix: false,
        });
    });

    it("sem nada preenchido, não há erro de Pix", () => {
        const errors = validateTrajectory(draft());

        expect(errors.pixType).toBeUndefined();
        expect(errors.pixKey).toBeUndefined();
        expect(errors.pixReceiver).toBeUndefined();
    });

    it("Pix completo e válido não tem erro", () => {
        expect(validateTrajectory(draft(pix))).toEqual({});
    });

    it("começou a preencher: pede o tipo, a chave e o nome", () => {
        const errors = validateTrajectory(draft({ pixKey: "abc" }));

        expect(errors.pixType).toBe("Escolha o tipo da chave Pix.");
        expect(errors.pixReceiver).toBe(
            "Informe o nome de quem recebe o Pix, como aparece no banco.",
        );
    });

    it("chave que não combina com o tipo", () => {
        expect(
            validateTrajectory(draft({ ...pix, pixType: "cpf" })).pixKey,
        ).toBe("Chave Pix inválida para o tipo escolhido.");
    });

    it("nome de quem recebe com mais de 60 caracteres", () => {
        expect(
            validateTrajectory(draft({ ...pix, pixReceiver: "a".repeat(61) }))
                .pixReceiver,
        ).toBe("Nome de quem recebe o Pix deve ter no máximo 60 caracteres.");
    });

    it("envia o Pix com a chave normalizada", () => {
        expect(trajectoryBody(draft(pix)).pix).toEqual({
            tipo: "telefone",
            chave: "+5561999998888",
            nomeRecebedor: "Maria da Silva",
            publico: true,
        });
    });

    it("sem Pix e sem Pix salvo, não envia o campo", () => {
        expect(trajectoryBody(draft())).not.toHaveProperty("pix");
    });

    it("apagar o Pix que estava salvo envia null, para removê-lo", () => {
        expect(trajectoryBody(draft({ hadPix: true })).pix).toBeNull();
    });
});
