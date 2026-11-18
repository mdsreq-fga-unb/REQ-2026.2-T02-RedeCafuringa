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
        const deletedIds = readDeletedDemoUsers();
        const users = readMockUserDetails()
            .filter(
                (item) =>
                    !deletedIds.includes(item.id) &&
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
        const user = readMockUserDetails().find(
            (item) => item.id === id && !readDeletedDemoUsers().includes(id),
        );
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

/** RN04: motivos aceitos para a exclusão administrativa. */
export type DeletionReason = "INATIVIDADE" | "DESCUMPRIMENTO_REGRAS";

/** Rótulo e consequência de cada motivo, na ordem do diálogo. */
export const deletionReasons: Record<
    DeletionReason,
    { label: string; hint: string }
> = {
    INATIVIDADE: {
        label: "Inatividade",
        hint: "A pessoa poderá se cadastrar de novo com os mesmos dados.",
    },
    DESCUMPRIMENTO_REGRAS: {
        label: "Banimento por descumprimento das regras",
        hint: "A pessoa não poderá se cadastrar de novo com o mesmo CPF, CNPJ ou e-mail.",
    },
};

const DELETED_DEMO_USERS = "cafuringa-demo-deleted-users";

/** Contas excluídas na demonstração (sem API), só para a lista refletir a ação. */
export function readDeletedDemoUsers(): string[] {
    try {
        const ids: unknown = JSON.parse(
            localStorage.getItem(DELETED_DEMO_USERS) ?? "[]",
        );
        return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
        return [];
    }
}

/**
 * Exclui definitivamente a conta (`DELETE /users/{id}`). O motivo é
 * obrigatório (RN04) e vai como parâmetro; nenhum dado pessoal vai na URL.
 */
export async function deleteUser(
    id: string,
    motivo: DeletionReason,
): Promise<void> {
    if (isMockAuthEnabled) {
        localStorage.setItem(
            DELETED_DEMO_USERS,
            JSON.stringify([...new Set([...readDeletedDemoUsers(), id])]),
        );
        return;
    }
    await getApiClient().delete<void>(`/users/${encodeURIComponent(id)}`, {
        headers: sessionHeaders(),
        query: { motivo },
    });
}

/** Como a conta é nomeada na confirmação e no aviso de sucesso. */
export function accountLabel(user: UserDetail): string {
    return user.perfil === "PRODUTOR" && user.nomeIniciativa
        ? `${user.nomeIniciativa} (${user.nome})`
        : user.nome;
}
