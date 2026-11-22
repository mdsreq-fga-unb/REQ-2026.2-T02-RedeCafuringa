import { useRef, useState } from "react";
import type { AuthResult, Role } from "../../shared/types";
import {
    bookingRoute,
    experienceDetailsRoute,
    receivedBookingRoute,
} from "@/features/bookings/bookingRoutes";
import { loginMock } from "./mockAuth";
import { isMockAuthEnabled } from "./authMode";
import { resetDemoData, type DemoResetAction } from "./demoTools";
import "./demoNavigation.css";

type DemoScreen = {
    label: string;
    path: string;
    authenticated?: boolean;
};

type DemoGroup = {
    title: string;
    description: string;
    role: Role | null;
    email?: string;
    entry?: { label: string; path: string };
    screens: DemoScreen[];
};

const groups: DemoGroup[] = [
    {
        title: "Visitante",
        description: "Catálogo, busca e detalhes públicos.",
        role: null,
        screens: [
            { label: "Explorar", path: "/explorar" },
            { label: "Buscar por Queijos", path: "/buscar?q=Queijos" },
            { label: "Produtos", path: "/produtos" },
            { label: "Experiências", path: "/experiencias" },
            { label: "Detalhe de produto", path: "/oferta/mel" },
            {
                label: "Detalhe de experiência",
                path: experienceDetailsRoute("queijos"),
            },
            { label: "Escolher perfil", path: "/escolher-perfil" },
            { label: "Recuperar acesso", path: "/recuperar-acesso" },
        ],
    },
    {
        title: "Consumidora",
        description: "Cadastro, conta e solicitação de pré-reserva.",
        role: "consumer",
        email: "ana@exemplo.com",
        entry: { label: "Entrar como consumidora de teste", path: "/conta" },
        screens: [
            { label: "Tela de login", path: "/login/consumer" },
            { label: "Cadastro", path: "/cadastro/consumidor" },
            { label: "Conta", path: "/conta", authenticated: true },
            {
                label: "Solicitar pré-reserva · HU44",
                path: bookingRoute("queijos"),
                authenticated: true,
            },
        ],
    },
    {
        title: "Produtora",
        description: "Perfil, ofertas e resposta às pré-reservas.",
        role: "producer",
        email: "produtor@exemplo.com",
        entry: { label: "Entrar como produtora de teste", path: "/conta" },
        screens: [
            {
                label: "Notificações · HU47",
                path: "/notificacoes",
                authenticated: true,
            },
            {
                label: "Responder pré-reserva · HU47",
                path: receivedBookingRoute("demo-reserva-124"),
                authenticated: true,
            },
            { label: "Conta", path: "/conta", authenticated: true },
            {
                label: "Minha trajetória",
                path: "/minha-trajetoria",
                authenticated: true,
            },
            { label: "Catálogo", path: "/catalogo", authenticated: true },
            {
                label: "Cadastrar produto",
                path: "/produtos/novo",
                authenticated: true,
            },
            {
                label: "Cadastrar experiência",
                path: "/experiencias/nova",
                authenticated: true,
            },
            { label: "Tela de login", path: "/login/producer" },
            { label: "Cadastro", path: "/cadastro" },
        ],
    },
    {
        title: "Administradora",
        description:
            "Acesso, gestão de usuárias e cadastro de administradoras.",
        role: "admin",
        email: "admin@exemplo.com",
        entry: {
            label: "Entrar como administradora de teste",
            path: "/admin/acesso",
        },
        screens: [
            { label: "Tela de acesso", path: "/admin/acesso" },
            { label: "Tela de login", path: "/admin/entrar" },
            {
                label: "Usuárias cadastradas",
                path: "/admin/usuarios",
                authenticated: true,
            },
            {
                label: "Cadastrar administradora",
                path: "/cadastro/administrador",
                authenticated: true,
            },
        ],
    },
];

export function DemoNavigation({
    role,
    onNavigate,
    onSignIn,
    onSignOut,
}: {
    role: Role | null;
    onNavigate: (path: string) => void;
    onSignIn: (auth: AuthResult) => void;
    onSignOut: () => void;
}) {
    const panel = useRef<HTMLDetailsElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    if (!isMockAuthEnabled) return null;

    const reset = (action: DemoResetAction) => {
        if (
            action !== "session" &&
            !window.confirm(
                action === "all"
                    ? "Restaurar a demonstração e apagar seus cadastros, respostas e configurações de teste neste navegador?"
                    : "Apagar as usuárias cadastradas localmente e encerrar a sessão? As contas padrão de teste continuarão disponíveis.",
            )
        ) {
            return;
        }
        if (resetDemoData(action)) {
            window.location.hash = "/escolher-perfil";
            window.location.reload();
        }
    };

    const openScreen = async (
        path: string,
        email?: string,
        asVisitor = false,
    ) => {
        setError("");
        if (email) {
            setBusy(true);
            try {
                const auth = await loginMock({ email, password: "senha123" });
                onSignIn(auth);
            } catch {
                setError(
                    "Não foi possível iniciar a sessão de teste. Tente novamente.",
                );
                return;
            } finally {
                setBusy(false);
            }
        } else if (asVisitor && role) {
            onSignOut();
        }
        onNavigate(path);
        if (panel.current) panel.current.open = false;
    };

    return (
        <aside className="demo-navigation" aria-label="Demonstração local">
            <details ref={panel}>
                <summary>
                    <span>Modo local · Explorar telas</span>
                    <span className="demo-session">
                        Sessão:{" "}
                        {groups.find((group) => group.role === role)?.title}
                    </span>
                </summary>
                <div className="demo-panel">
                    <p className="demo-intro">
                        Escolha um perfil para testar os fluxos com dados
                        fictícios. Os atalhos de telas protegidas iniciam a
                        sessão de teste quando necessário.
                    </p>
                    {error && (
                        <p role="alert" className="demo-error">
                            {error}
                        </p>
                    )}
                    <div className="demo-groups">
                        {groups.map((group) => (
                            <section
                                key={group.title}
                                className="demo-group"
                                aria-label={group.title}
                            >
                                <h2>{group.title}</h2>
                                <p>{group.description}</p>
                                {group.entry && (
                                    <button
                                        type="button"
                                        className="demo-entry"
                                        disabled={busy}
                                        onClick={() =>
                                            void openScreen(
                                                group.entry!.path,
                                                group.email,
                                            )
                                        }
                                    >
                                        {group.entry.label}
                                    </button>
                                )}
                                <ul>
                                    {group.screens.map((screen) => (
                                        <li key={screen.path}>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    void openScreen(
                                                        screen.path,
                                                        screen.authenticated &&
                                                            group.role !== role
                                                            ? group.email
                                                            : undefined,
                                                        group.role === null,
                                                    )
                                                }
                                            >
                                                <span>{screen.label}</span>
                                                <span aria-hidden="true">
                                                    →
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                    <details className="demo-tools">
                        <summary>Gerenciar dados de teste</summary>
                        <p>
                            As alterações afetam os dados locais deste
                            navegador.
                        </p>
                        <div className="demo-tool-actions">
                            <button
                                type="button"
                                onClick={() => reset("session")}
                            >
                                Encerrar sessão de teste
                            </button>
                            <button
                                type="button"
                                onClick={() => reset("users")}
                            >
                                Apagar usuárias cadastradas
                            </button>
                            <button type="button" onClick={() => reset("all")}>
                                Restaurar demonstração
                            </button>
                        </div>
                    </details>
                </div>
            </details>
        </aside>
    );
}
