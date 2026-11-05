import type { AuthResult } from "../../shared/types";
import { loginMock } from "./mockAuth";
import { isMockAuthEnabled } from "./authMode";
import { resetDemoData, type DemoResetAction } from "./demoTools";

const screens = [
    ["Escolha de perfil", "/escolher-perfil"],
    ["Login consumidor", "/login/consumer"],
    ["Login produtor", "/login/producer"],
    ["Cadastro consumidor", "/cadastro/consumidor"],
    ["Cadastro produtor", "/cadastro"],
    ["Acesso administrador", "/admin/acesso"],
    ["Login administrador", "/admin/entrar"],
    ["Cadastro administrador", "/cadastro/administrador"],
    ["Sucesso administrador", "/conta-criada/admin"],
    ["Sucesso consumidor", "/conta-criada/consumer"],
    ["Sucesso produtor", "/conta-criada/producer"],
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
                    : "Apagar os usuários cadastrados localmente e encerrar a sessão? As contas padrão de teste continuarão disponíveis.",
            )
        )
            return;
        if (resetDemoData(action)) {
            // Reinicia também os cadastros de produtor mantidos em memória.
            window.location.hash = "/escolher-perfil";
            window.location.reload();
        }
    };
    const enter = async (cpf: string) => {
        onSignIn(await loginMock({ cpf, password: "senha123" }));
        onNavigate("/conta");
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
                        onClick={() => void enter("52998224725")}
                    >
                        Entrar como consumidor de teste
                    </button>
                    <button
                        type="button"
                        onClick={() => void enter("11144477735")}
                    >
                        Entrar como produtor de teste
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
                            Apagar usuários cadastrados
                        </button>
                        <button type="button" onClick={() => reset("session")}>
                            Encerrar sessão de teste
                        </button>
                        <button type="button" onClick={() => reset("all")}>
                            Restaurar demonstração
                        </button>
                    </nav>
                    <p>
                        As contas padrão de consumidor e produtor permanecem
                        disponíveis.
                    </p>
                </fieldset>
            </details>
        </aside>
    );
}
