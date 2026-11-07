import { ApiHttpError, getApiClient } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { readMockUserDetails } from "@/features/auth/mockAuth";

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
        };
    }
    return getApiClient().get<PublicTrajectory>(
        `/producers/${encodeURIComponent(id)}/trajectory`,
        { auth: false, signal },
    );
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
