import type { SaveTrajectory } from "./trajectoryService";

export type TrajectoryDraft = {
    story: string;
    activities: string;
    phone: string;
    phonePublic: boolean;
    photo: File | null;
};
export const emptyTrajectory: TrajectoryDraft = {
    story: "",
    activities: "",
    phone: "",
    phonePublic: false,
    photo: null,
};
export type TrajectoryErrors = Partial<Record<keyof TrajectoryDraft, string>>;
export const TEXT_LIMIT = 2000;

// Mesmo tratamento de espaços e caracteres invisíveis do contrato do backend.
export function normalizeTrajectoryText(value: string) {
    return value
        .replace(/\r\n?/g, "\n")
        .replace(/[\u2028\u2029]/g, "\n")
        .replace(
            // eslint-disable-next-line no-control-regex
            /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b\u2060-\u2064\ufeff\u202a-\u202e\u2066-\u2069]/g,
            "",
        )
        .trim();
}

export function validateTrajectory(draft: TrajectoryDraft): TrajectoryErrors {
    const errors: TrajectoryErrors = {};
    for (const [key, label] of [
        ["story", "Trajetória"],
        ["activities", "Produção / Experiências / Eventos"],
    ] as const) {
        const text = normalizeTrajectoryText(draft[key]);
        if (!text) errors[key] = `${label} é obrigatório.`;
        else if (text.length > TEXT_LIMIT)
            errors[key] =
                `${label} deve ter no máximo ${TEXT_LIMIT} caracteres.`;
    }
    if (
        draft.phone.trim() &&
        !/^\d{10,11}$/.test(draft.phone.replace(/\D/g, ""))
    )
        errors.phone =
            "Telefone inválido. Informe o DDD e o número (10 ou 11 dígitos).";
    if (
        draft.photo &&
        !["image/png", "image/jpeg", "image/webp"].includes(draft.photo.type)
    )
        errors.photo = "Escolha uma foto PNG, JPEG ou WebP.";
    return errors;
}

export function trajectoryBody(draft: TrajectoryDraft): SaveTrajectory {
    const telefone = draft.phone.replace(/\D/g, "");
    return {
        trajetoria: normalizeTrajectoryText(draft.story),
        atividades: normalizeTrajectoryText(draft.activities),
        telefone: telefone || null,
        telefonePublico: Boolean(telefone && draft.phonePublic),
    };
}
