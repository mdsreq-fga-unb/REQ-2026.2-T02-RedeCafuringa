import { describe, expect, it } from "vitest";
import {
    emptyTrajectory,
    normalizeTrajectoryText,
    trajectoryBody,
    validateTrajectory,
} from "@/features/trajectory/trajectoryModel";

const draft = {
    ...emptyTrajectory,
    story: "Nossa história",
    activities: "Horta e visitas",
};

describe("HU12 — normalização, contato e privacidade", () => {
    it("normaliza quebras de linha e remove controles sem apagar texto legítimo", () => {
        expect(
            normalizeTrajectoryText(
                "  Nossa\r\nhistória\u2028no campo\u200b\u202e\u0000  ",
            ),
        ).toBe("Nossa\nhistória\nno campo");
    });
    it("mantém HTML como texto e preserva emojis com ZWJ", () => {
        const text = "<b>Família</b> 👨‍👩‍👧‍👦";
        expect(normalizeTrajectoryText(text)).toBe(text);
    });
    it("contato apagado usa null e revoga a divulgação, conforme o contrato", () => {
        expect(
            trajectoryBody({ ...draft, phone: "", phonePublic: true }),
        ).toEqual({
            trajetoria: draft.story,
            atividades: draft.activities,
            telefone: null,
            telefonePublico: false,
        });
    });
    it("telefone não informado é opcional, sem impedir a edição de um perfil já existente", () => {
        expect(validateTrajectory(draft)).toEqual({});
    });
    it("permite continuar sem selecionar foto", () => {
        expect(validateTrajectory(draft).photo).toBeUndefined();
    });
    it.each(["image/png", "image/jpeg", "image/webp"])(
        "aceita prévia de foto %s",
        (type) => {
            expect(
                validateTrajectory({
                    ...draft,
                    photo: new File(["image"], "foto", { type }),
                }),
            ).toEqual({});
        },
    );
    it("recusa arquivos executáveis ou HTML usados como foto", () => {
        expect(
            validateTrajectory({
                ...draft,
                photo: new File(["<script>"], "foto.html", {
                    type: "text/html",
                }),
            }).photo,
        ).toMatch(/PNG, JPEG ou WebP/);
    });
    it("não envia foto ou credenciais no corpo PUT da trajetória", () => {
        expect(
            Object.keys(
                trajectoryBody({
                    ...draft,
                    photo: new File(["png"], "foto.png", { type: "image/png" }),
                }),
            ).sort(),
        ).toEqual(["atividades", "telefone", "telefonePublico", "trajetoria"]);
    });
});
