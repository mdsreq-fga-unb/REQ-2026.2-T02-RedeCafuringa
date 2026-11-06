import { ApiHttpError, getApiClient } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { readMockUserDetails } from "@/features/auth/mockAuth";

export type UserDetail = components["schemas"]["UserDetailResponse"];
export type UserSummary = components["schemas"]["UserSummaryResponse"];
export type UserList = components["schemas"]["UserListResponse"];
export type UserQuery = {
    busca?: string;
    pagina?: number;
    perfil?: UserDetail["perfil"];
};

export const profileLabels: Record<UserDetail["perfil"], string> = {
    CONSUMIDOR: "Consumidor",
    PRODUTOR: "Produtor",
    ADMINISTRADOR: "Administrador",
};

function sessionHeaders() {
    const token = localStorage.getItem("cafuringa-token");
    if (!token)
        throw new ApiHttpError({
            status: 401,
            message: "Entre com uma conta administrativa.",
        });
    return { Authorization: `Bearer ${token}` };
}

export async function listUsers(
    query: UserQuery,
    signal?: AbortSignal,
): Promise<UserList> {
    if (isMockAuthEnabled) {
        const search = (query.busca ?? "").trim().toLocaleLowerCase("pt-BR");
        const users = readMockUserDetails()
            .filter(
                (item) =>
                    (!query.perfil || item.perfil === query.perfil) &&
                    [item.nome, item.email, item.nomeIniciativa ?? ""].some(
                        (value) =>
                            value.toLocaleLowerCase("pt-BR").includes(search),
                    ),
            )
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        const pagina = query.pagina ?? 1;
        return {
            itens: users
                .slice((pagina - 1) * 20, pagina * 20)
                .map(({ id, nome, email, perfil, nomeIniciativa }) => ({
                    id,
                    nome,
                    email,
                    perfil,
                    nomeIniciativa,
                })),
            total: users.length,
            pagina,
            limite: 20,
        };
    }
    return getApiClient().get<UserList>("/users", {
        headers: sessionHeaders(),
        query: { ...query, limite: 20 },
        signal,
    });
}

export async function getUser(
    id: string,
    signal?: AbortSignal,
): Promise<UserDetail> {
    if (isMockAuthEnabled) {
        const user = readMockUserDetails().find((item) => item.id === id);
        if (!user)
            throw new ApiHttpError({
                status: 404,
                message: "Usuário não encontrado",
            });
        return user;
    }
    return getApiClient().get<UserDetail>(`/users/${encodeURIComponent(id)}`, {
        headers: sessionHeaders(),
        signal,
    });
}
