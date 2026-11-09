import { ApiHttpError, apiResourceUrl, getApiClient } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { readMockUserDetails } from "@/features/auth/mockAuth";
import { prepareProfilePhoto } from "./photoResize";
import type { TrajectoryDraft } from "./trajectoryModel";

export type OwnTrajectory = components["schemas"]["OwnTrajectoryResponse"];
export type PublicTrajectory =
    components["schemas"]["PublicTrajectoryResponse"];
// O DTO do backend aceita string | null; o schema atual omite o tipo da união nullable.
export type SaveTrajectory = Omit<
    components["schemas"]["SaveTrajectoryDto"],
    "telefone"
> & { telefone?: string | null };

// Demonstração: dados separados por produtor e sem chamadas ao backend real.
const demoTrajectories = new Map<string, OwnTrajectory>();
const missingProfile = () =>
    new ApiHttpError({ status: 404, message: "Perfil indisponível." });

function authHeaders(token = localStorage.getItem("cafuringa-token")) {
    if (!token)
        throw new ApiHttpError({
            status: 401,
            message:
                "Entre novamente para salvar sua trajetória. Seu rascunho foi preservado.",
        });
    return { Authorization: `Bearer ${token}` };
}

export async function getOwnTrajectory(
    signal?: AbortSignal,
): Promise<OwnTrajectory> {
    const headers = authHeaders();
    if (isMockAuthEnabled)
        return (
            demoTrajectories.get(headers.Authorization) ?? {
                telefonePublico: false,
            }
        );
    return getApiClient().get<OwnTrajectory>("/producers/me/trajectory", {
        headers,
        signal,
    });
}

export async function saveTrajectory(
    body: SaveTrajectory,
    token?: string,
): Promise<OwnTrajectory> {
    const headers = authHeaders(token);
    if (isMockAuthEnabled) {
        const previous = demoTrajectories.get(headers.Authorization);
        const telefone =
            body.telefone === null
                ? undefined
                : (body.telefone ?? previous?.telefone);
        const result: OwnTrajectory = {
            trajetoria: body.trajetoria,
            atividades: body.atividades,
            telefone,
            telefonePublico: Boolean(
                telefone && (body.telefonePublico ?? previous?.telefonePublico),
            ),
            atualizadoEm: new Date().toISOString(),
            ...(previous?.fotoUrl ? { fotoUrl: previous.fotoUrl } : {}),
        };
        demoTrajectories.set(headers.Authorization, result);
        return result;
    }
    return getApiClient().put<OwnTrajectory>("/producers/me/trajectory", body, {
        headers,
    });
}

export async function getPublicTrajectory(
    id: string,
    signal?: AbortSignal,
): Promise<PublicTrajectory> {
    if (isMockAuthEnabled) {
        const profile = readMockUserDetails().find(
            (user) => user.id === id && user.perfil === "PRODUTOR",
        );
        const saved = demoTrajectories.get(`Bearer mock-token-${id}`);
        if (!profile || !saved?.trajetoria) throw missingProfile();
        return {
            id,
            nomeIniciativa: profile.nomeIniciativa ?? profile.nome,
            categoriaOfertada: profile.categoriaOfertada,
            trajetoria: saved.trajetoria,
            atividades: saved.atividades,
            ...(saved.telefonePublico ? { telefone: saved.telefone } : {}),
            ...(saved.fotoUrl ? { fotoUrl: saved.fotoUrl } : {}),
        };
    }
    return getApiClient().get<PublicTrajectory>(
        `/producers/${encodeURIComponent(id)}/trajectory`,
        { auth: false, signal },
    );
}

export type PhotoResponse = components["schemas"]["PhotoResponse"];

/** `src` da foto a partir do `fotoUrl` da API; vazio quando não há foto. */
export function photoSrc(fotoUrl: string | undefined): string {
    if (!fotoUrl) return "";
    // Demonstração: a foto fica só no navegador, como blob.
    if (isMockAuthEnabled && fotoUrl.startsWith("blob:")) return fotoUrl;
    return apiResourceUrl(fotoUrl);
}

/** HU12/RF12: envia a foto de perfil (multipart, campo `foto`). */
export async function uploadPhoto(
    photo: Blob,
    token?: string,
): Promise<PhotoResponse> {
    const headers = authHeaders(token);
    if (isMockAuthEnabled) {
        const fotoUrl = URL.createObjectURL(photo);
        const previous = demoTrajectories.get(headers.Authorization);
        demoTrajectories.set(headers.Authorization, {
            telefonePublico: false,
            ...previous,
            fotoUrl,
        });
        return { fotoUrl };
    }
    const body = new FormData();
    if (photo instanceof File) body.append("foto", photo);
    else body.append("foto", photo, "foto.jpg");
    return getApiClient().put<PhotoResponse>("/producers/me/photo", body, {
        headers,
        // Upload em conexão rural pode levar mais que o padrão de 10 s.
        timeoutMs: 60_000,
    });
}

/** HU12/RF12: remove a foto de perfil. */
export async function deletePhoto(token?: string): Promise<void> {
    const headers = authHeaders(token);
    if (isMockAuthEnabled) {
        const previous = demoTrajectories.get(headers.Authorization);
        if (previous)
            demoTrajectories.set(headers.Authorization, {
                ...previous,
                fotoUrl: undefined,
            });
        return;
    }
    await getApiClient().delete<void>("/producers/me/photo", { headers });
}

/**
 * Aplica a mudança de foto do rascunho: envia a nova (reduzida no aparelho)
 * ou remove a atual. Devolve o novo `src` ("" se removida) ou undefined se a
 * foto não mudou.
 */
export async function syncPhoto(
    draft: Pick<TrajectoryDraft, "photo" | "removePhoto">,
    token?: string,
): Promise<string | undefined> {
    if (draft.photo) {
        const prepared = await prepareProfilePhoto(draft.photo);
        const { fotoUrl } = await uploadPhoto(prepared, token);
        return photoSrc(fotoUrl);
    }
    if (draft.removePhoto) {
        await deletePhoto(token);
        return "";
    }
    return undefined;
}

/** Motivo de uma falha no envio ou na remoção da foto, para o titular. */
export function photoError(error: unknown, removing = false): string {
    if (removing)
        return "a foto não foi removida. Verifique a conexão e tente novamente.";
    if (error instanceof ApiHttpError) {
        if (error.status === 413)
            return "a foto não foi enviada: o arquivo é grande demais (máximo 5 MB). Escolha outra foto.";
        if (error.status === 415 || error.status === 400)
            return `a foto não foi enviada: ${error.message}`;
        if (error.status === 401)
            return "a foto não foi enviada porque sua sessão expirou. Entre novamente e tente outra vez.";
    }
    return "a foto não foi enviada. Verifique a conexão e tente novamente.";
}

export function trajectoryError(error: unknown, loading = false): string {
    if (error instanceof ApiHttpError) {
        if (error.status === 401)
            return "Sua sessão expirou. Entre novamente para continuar. Seu rascunho foi preservado.";
        if (error.status === 403)
            return "Você não tem permissão para salvar esta trajetória. Seu rascunho foi preservado.";
        if (error.status === 400)
            return error.details.length
                ? error.details.join(" ")
                : error.message;
        if (error.status === 429)
            return "Muitas tentativas. Aguarde um instante antes de tentar novamente.";
    }
    return loading
        ? "Falha ao carregar sua trajetória. Verifique a conexão e tente novamente."
        : "Não foi possível salvar a trajetória. Verifique a conexão e tente novamente. Seus dados foram preservados.";
}
