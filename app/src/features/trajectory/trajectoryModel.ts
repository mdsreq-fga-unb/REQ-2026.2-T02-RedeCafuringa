import { normalizePixKey, type PixKeyType } from "@/features/payments/pixCode";
import { validateVideoUrl } from "@/features/video/youtube";
import type { SaveTrajectory } from "./trajectoryService";

export type TrajectoryDraft = {
    story: string;
    activities: string;
    phone: string;
    phonePublic: boolean;
    /** Nova foto escolhida, ainda não enviada. */
    photo: File | null;
    /** `src` da foto já salva ("" se não houver). */
    photoUrl: string;
    /** Pedido de remoção da foto salva, aplicado ao salvar. */
    removePhoto: boolean;
    /** Pix para receber o sinal das pré-reservas. */
    pixType: PixKeyType | "";
    pixKey: string;
    pixReceiver: string;
    pixPublic: boolean;
    /** Já havia Pix salvo: apagar os campos pede a remoção ao salvar. */
    hadPix: boolean;
    /** Link do vídeo do YouTube, como está no campo. */
    videoUrl: string;
    /** Já havia vídeo salvo: apagar o link pede a remoção ao salvar. */
    hadVideo: boolean;
};
export const emptyTrajectory: TrajectoryDraft = {
    story: "",
    activities: "",
    phone: "",
    phonePublic: false,
    photo: null,
    photoUrl: "",
    removePhoto: false,
    pixType: "",
    pixKey: "",
    pixReceiver: "",
    pixPublic: false,
    hadPix: false,
    videoUrl: "",
    hadVideo: false,
};
export const PIX_RECEIVER_MAX = 60;

/** A produtora começou a preencher o Pix? */
function hasPix(draft: TrajectoryDraft) {
    return Boolean(
        draft.pixType || draft.pixKey.trim() || draft.pixReceiver.trim(),
    );
}
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
    if (hasPix(draft)) {
        if (!draft.pixType) errors.pixType = "Escolha o tipo da chave Pix.";
        else if (!normalizePixKey(draft.pixType, draft.pixKey))
            errors.pixKey = "Chave Pix inválida para o tipo escolhido.";
        const receiver = normalizeTrajectoryText(draft.pixReceiver);
        if (!receiver)
            errors.pixReceiver =
                "Informe o nome de quem recebe o Pix, como aparece no banco.";
        else if (receiver.length > PIX_RECEIVER_MAX)
            errors.pixReceiver = `Nome de quem recebe o Pix deve ter no máximo ${PIX_RECEIVER_MAX} caracteres.`;
    }

    const video = validateVideoUrl(draft.videoUrl);
    if (video) errors.videoUrl = video;
    return errors;
}

export function trajectoryBody(draft: TrajectoryDraft): SaveTrajectory {
    const telefone = draft.phone.replace(/\D/g, "");
    const videoUrl = draft.videoUrl.trim();
    return {
        trajetoria: normalizeTrajectoryText(draft.story),
        atividades: normalizeTrajectoryText(draft.activities),
        telefone: telefone || null,
        telefonePublico: Boolean(telefone && draft.phonePublic),
        ...pixBody(draft),
        // Sem link, o campo só vai quando é para remover o vídeo salvo:
        // omitido, a API mantém o que já existe.
        ...(videoUrl ? { videoUrl } : draft.hadVideo ? { videoUrl: null } : {}),
    };
}

/** Pix: completo vai normalizado; vazio só vai (como null) para remover o salvo. */
function pixBody(draft: TrajectoryDraft): Pick<SaveTrajectory, "pix"> {
    const chave = draft.pixType
        ? normalizePixKey(draft.pixType, draft.pixKey)
        : null;
    if (draft.pixType && chave)
        return {
            pix: {
                tipo: draft.pixType,
                chave,
                nomeRecebedor: normalizeTrajectoryText(draft.pixReceiver),
                publico: draft.pixPublic,
            },
        };
    return !hasPix(draft) && draft.hadPix ? { pix: null } : {};
}
