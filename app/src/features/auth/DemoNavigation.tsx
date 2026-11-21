import type { AuthResult } from "../../shared/types";
import { loginMock } from "./mockAuth";
import { isMockAuthEnabled } from "./authMode";
import { resetDemoData, type DemoResetAction } from "./demoTools";

const screens = [
    ["Explorar", "/explorar"],
    ["Escolha de perfil", "/escolher-perfil"],
    ["Login consumidora", "/login/consumer"],
    ["Login produtora", "/login/producer"],
    ["Cadastro consumidora", "/cadastro/consumidor"],
    ["Cadastro produtora", "/cadastro"],
    ["Acesso administradora", "/admin/acesso"],
    ["Login administradora", "/admin/entrar"],
    ["Usuárias cadastradas", "/admin/usuarios"],
    ["Cadastro administradora", "/cadastro/administrador"],
    ["Sucesso administradora", "/conta-criada/admin"],
    ["Sucesso consumidora", "/conta-criada/consumer"],
    ["Sucesso produtora", "/conta-criada/producer"],
    ["Perfil", "/perfil"],
    ["Catálogo", "/catalogo"],
] as const;

export function DemoNavigation({
    onNavigate,
    onSignIn,
}: {
    onNavigate: (path: string) => void;
    onSignIn: (auth: AuthResult) => void;
}) {
    if (!isMockAuthEnabled) return null;
    const reset = (action: DemoResetAction) => {
        if (
            action !== "session" &&
            !window.confirm(
                action === "all"
                    ? "Apagar os cadastros locais, a sessão e as configurações de teste?"
                    : "Apagar as usuárias cadastradas localmente e encerrar a sessão? As contas padrão de teste continuarão disponíveis.",
            )
        )
            return;
        if (resetDemoData(action)) {
            // Reinicia também os cadastros de produtor mantidos em memória.
            window.location.hash = "/escolher-perfil";
            window.location.reload();
        }
    };
    const enter = async (email: string) => {
        const auth = await loginMock({ email, password: "senha123" });
        onSignIn(auth);
        onNavigate(auth.user.role === "admin" ? "/admin/acesso" : "/conta");
    };
    return (
        <aside className="demo-navigation" aria-label="Demonstração local">
            <details>
                <summary>Modo local · Explorar telas</summary>
                <p>
                    Dados fictícios, sem API. Desative com
                    VITE_USE_MOCK_AUTH=false.
                </p>
                <nav aria-label="Telas de demonstração">
                    {screens.map(([label, path]) => (
                        <button
                            type="button"
                            key={path}
                            onClick={() => onNavigate(path)}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => void enter("ana@exemplo.com")}
                    >
                        Entrar como consumidora de teste
                    </button>
                    <button
                        type="button"
                        onClick={() => void enter("admin@exemplo.com")}
                    >
                        Entrar como administradora de teste
                    </button>
                    <button
                        type="button"
                        onClick={() => void enter("produtor@exemplo.com")}
                    >
                        Entrar como produtora de teste
                    </button>
                </nav>
                <fieldset className="demo-tools">
                    <legend>Ferramentas de desenvolvedor</legend>
                    <p>
                        Afetam somente os dados locais deste navegador. Após a
                        limpeza, a página será recarregada.
                    </p>
                    <nav aria-label="Ferramentas de desenvolvedor">
                        <button type="button" onClick={() => reset("users")}>
                            Apagar usuárias cadastradas
                        </button>
                        <button type="button" onClick={() => reset("session")}>
                            Encerrar sessão de teste
                        </button>
                        <button type="button" onClick={() => reset("all")}>
                            Restaurar demonstração
                        </button>
                    </nav>
                    <p>
                        As contas padrão de consumidora e produtora permanecem
                        disponíveis.
                    </p>
                </fieldset>
            </details>
        </aside>
    );
}
