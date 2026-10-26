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
    return (
        <nav className="bottom-nav" aria-label="Navegação principal">
            <button
                className={
                    path === "/perfil" || path === "/catalogo" ? "active" : ""
                }
                onClick={() => onNavigate("/perfil")}
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M3 10.5 12 3l9 7.5v10H3z" />
                    <path d="M9 20.5v-7h6v7" />
                </svg>
                Explorar
            </button>
            <button
                className={path === "/notificacoes" ? "active" : ""}
                onClick={() => onNavigate("/notificacoes")}
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
                className={path === "/reservas" ? "active" : ""}
                onClick={() => onNavigate("/reservas")}
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <rect x="3" y="5" width="18" height="16" rx="1" />
                    <path d="M7 3v4m10-4v4M3 10h18" />
                </svg>
                Pré-reservas
            </button>
            <button
                className={path === "/conta" ? "active" : ""}
                onClick={() => onNavigate(role ? "/conta" : "/entrar")}
            >
                <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 21v-2a8 8 0 0 1 16 0v2z" />
                </svg>
                Conta
            </button>
        </nav>
    );
}
