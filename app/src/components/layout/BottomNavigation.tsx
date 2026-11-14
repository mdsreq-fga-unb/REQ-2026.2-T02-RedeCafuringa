import type { Role } from "../../shared/types";

type BottomNavigationProps = {
    path: string;
    role: Role | null;
    onNavigate: (path: string) => void;
};

export function BottomNavigation({
    path,
    role,
    onNavigate,
}: BottomNavigationProps) {
    const isProducer = role === "producer";
    const panelActive =
        path === "/perfil" || path === "/catalogo" || path === "/produtos";
    const accountActive =
        path === "/conta" || (isProducer && path === "/minha-trajetoria");
    return (
        <nav
            className={`bottom-nav${isProducer ? " bottom-nav-producer" : ""}`}
            aria-label="Navegação principal"
        >
            <button
                className={panelActive ? "active" : ""}
                aria-current={panelActive ? "page" : undefined}
                onClick={() =>
                    onNavigate(isProducer ? "/catalogo" : "/produtos")
                }
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    {isProducer ? (
                        <>
                            <path d="m3 10 9-7 9 7M5 9v12h14V9" />
                            <path d="M9 21v-8h6v8" />
                        </>
                    ) : (
                        <>
                            <path d="M3 10.5 12 3l9 7.5v10H3z" />
                            <path d="M9 20.5v-7h6v7" />
                        </>
                    )}
                </svg>
                {role === "producer" ? "Painel" : "Explorar"}
            </button>
            <button
                className={path === "/notificacoes" ? "active" : ""}
                aria-current={path === "/notificacoes" ? "page" : undefined}
                onClick={() =>
                    onNavigate(role ? "/notificacoes" : "/escolher-perfil")
                }
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                    <path d="M10 21h4" />
                </svg>
                Notificações
            </button>
            <button
                data-action={isProducer ? "add-product" : undefined}
                aria-current={
                    (
                        isProducer
                            ? ["/produtos/novo", "/experiencias/nova"].includes(
                                  path,
                              )
                            : path === "/reservas"
                    )
                        ? "page"
                        : undefined
                }
                className={
                    [
                        "/produtos/novo",
                        "/experiencias/nova",
                        "/reservas",
                    ].includes(path)
                        ? "active"
                        : ""
                }
                onClick={() =>
                    onNavigate(
                        role === "producer"
                            ? "/produtos/novo"
                            : role
                              ? "/reservas"
                              : "/escolher-perfil",
                    )
                }
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    {role === "producer" ? (
                        <path d="M12 3v18M3 12h18" />
                    ) : (
                        <>
                            <rect x="3" y="5" width="18" height="16" rx="1" />
                            <path d="M7 3v4m10-4v4M3 10h18" />
                        </>
                    )}
                </svg>
                {role === "producer" ? "Adicionar" : "Pré-reservas"}
            </button>
            <button
                className={accountActive ? "active" : ""}
                aria-current={accountActive ? "page" : undefined}
                onClick={() => onNavigate(role ? "/conta" : "/escolher-perfil")}
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    {isProducer ? (
                        <>
                            <circle cx="12" cy="5.5" r="3.5" />
                            <path d="M6 22v-7a6 6 0 0 1 12 0v7" />
                        </>
                    ) : (
                        <>
                            <circle cx="12" cy="7" r="4" />
                            <path d="M4 21v-2a8 8 0 0 1 16 0v2z" />
                        </>
                    )}
                </svg>
                Conta
            </button>
        </nav>
    );
}
