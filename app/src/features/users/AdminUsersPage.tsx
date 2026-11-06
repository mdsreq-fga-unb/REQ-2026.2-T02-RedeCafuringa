import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ApiHttpError } from "@/shared/api";
import { getUser, listUsers, profileLabels } from "./usersService";
import type { UserDetail, UserList, UserQuery } from "./usersService";
import "./users.css";

type Props = { id?: string; onNavigate: (path: string) => void };
type Result = { key: string; data?: UserDetail | UserList; error?: string };

export function AdminUsersPage({ id, onNavigate }: Props) {
    const [busca, setBusca] = useState("");
    const [perfil, setPerfil] = useState<UserQuery["perfil"]>();
    const [pagina, setPagina] = useState(1);
    const [retry, setRetry] = useState(0);
    const [result, setResult] = useState<Result>();
    const key = JSON.stringify([id, busca, perfil, pagina, retry]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const request = id
            ? getUser(id, controller.signal)
            : listUsers(
                  { busca: busca.trim() || undefined, perfil, pagina },
                  controller.signal,
              );
        void request
            .then((data) => {
                if (active) setResult({ key, data });
            })
            .catch((error: unknown) => {
                if (!active) return;
                if (
                    error instanceof ApiHttpError &&
                    [401, 403].includes(error.status)
                ) {
                    setResult({
                        key,
                        error: "Entre com uma conta administrativa.",
                    });
                    onNavigate("/admin/entrar");
                    return;
                }
                setResult({
                    key,
                    error:
                        error instanceof ApiHttpError && error.status === 404
                            ? "Usuário não encontrado"
                            : "Não foi possível carregar os usuários. Verifique sua conexão e tente novamente.",
                });
            });
        return () => {
            active = false;
            controller.abort();
        };
    }, [id, busca, perfil, pagina, retry, key, onNavigate]);

    const current = result?.key === key ? result : undefined;
    const list =
        current?.data && "itens" in current.data ? current.data : undefined;
    const detail =
        current?.data && "perfil" in current.data ? current.data : undefined;
    const pages = list ? Math.max(1, Math.ceil(list.total / list.limite)) : 1;

    return (
        <section
            className={`admin-users-page ${id ? "admin-user-detail" : ""}`}
            aria-labelledby="admin-users-heading"
        >
            <BackButton
                label="Voltar"
                onClick={() => onNavigate(id ? "/admin/usuarios" : "/conta")}
            />
            <h1 id="admin-users-heading">Usuários Cadastrados</h1>
            {!id && (
                <div className="admin-users-tools">
                    <div className="admin-users-search">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="10" cy="10" r="7" />
                            <path d="m15 15 6 6" />
                        </svg>
                        <input
                            type="search"
                            aria-label="Buscar usuário"
                            placeholder="Buscar usuário."
                            maxLength={100}
                            value={busca}
                            onChange={(event) => {
                                setBusca(event.target.value);
                                setPagina(1);
                            }}
                        />
                    </div>
                    <label className="admin-users-filter">
                        Perfil
                        <select
                            value={perfil ?? ""}
                            onChange={(event) => {
                                setPerfil(
                                    (event.target.value ||
                                        undefined) as UserQuery["perfil"],
                                );
                                setPagina(1);
                            }}
                        >
                            <option value="">Todos os perfis</option>
                            {Object.entries(profileLabels).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>
                </div>
            )}
            {!current && (
                <p className="admin-users-feedback" role="status">
                    Carregando {id ? "detalhes do usuário" : "usuários"}…
                </p>
            )}
            {current?.error && (
                <div className="admin-users-feedback">
                    <p role="alert">{current.error}</p>
                    {current.error !== "Usuário não encontrado" && (
                        <button
                            className="button button-outline"
                            onClick={() => setRetry((value) => value + 1)}
                        >
                            Tentar novamente
                        </button>
                    )}
                </div>
            )}
            {list && (
                <>
                    {list.itens.length === 0 ? (
                        <p className="admin-users-feedback" role="status">
                            Nenhum usuário para exibir
                            {busca ? " nesta busca" : ""}.
                        </p>
                    ) : (
                        <ul
                            className="admin-users-list"
                            aria-label="Usuários cadastrados"
                        >
                            {list.itens.map((user) => (
                                <li key={user.id} className="admin-user-card">
                                    <p className="admin-user-role">
                                        {profileLabels[user.perfil]}
                                    </p>
                                    <h2>{user.nome}</h2>
                                    <a
                                        href={`#/admin/usuarios/${encodeURIComponent(user.id)}`}
                                        aria-label={`Detalhes de ${user.nome}`}
                                    >
                                        Detalhes{" "}
                                        <span aria-hidden="true">→</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                    {pages > 1 && (
                        <nav
                            className="admin-users-pagination"
                            aria-label="Paginação de usuários"
                        >
                            <button
                                className="button button-outline"
                                disabled={pagina <= 1}
                                onClick={() => setPagina((value) => value - 1)}
                            >
                                Anterior
                            </button>
                            <span role="status">
                                Página {list.pagina} de {pages}
                            </span>
                            <button
                                className="button button-outline"
                                disabled={pagina >= pages}
                                onClick={() => setPagina((value) => value + 1)}
                            >
                                Próxima
                            </button>
                        </nav>
                    )}
                </>
            )}
            {detail && <UserDetails user={detail} />}
        </section>
    );
}

function UserDetails({ user }: { user: UserDetail }) {
    const producer = user.perfil === "PRODUTOR";
    const fields: [string, string | undefined][] = producer
        ? [
              ["Nome da iniciativa", user.nomeIniciativa],
              ["Responsável", user.nomeResponsavel || user.nome],
          ]
        : [["Nome completo", user.nome]];
    fields.push(["CPF", user.cpf]);
    if (producer)
        fields.push(
            ["CNPJ (empresa / MEI)", user.cnpj],
            ["Categoria", user.categoriaOfertada],
            ["Localidade", user.localidade],
            ["Formas de pagamento", user.formasPagamento?.join(", ")],
        );
    fields.push(["Telefone", user.telefone], ["E-mail", user.email]);
    return (
        <>
            <h2 className="admin-user-name">{user.nome}</h2>
            <p className="admin-user-role">{profileLabels[user.perfil]}</p>
            <dl className="admin-user-fields">
                {fields
                    .filter(([, value]) => value !== undefined && value !== "")
                    .map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
            </dl>
        </>
    );
}
