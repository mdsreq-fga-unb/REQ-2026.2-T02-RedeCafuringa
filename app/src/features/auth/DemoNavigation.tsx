import type { AuthResult } from "../../shared/types";
import { loginMock } from "./mockAuth";

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
            </details>
        </aside>
    );
}
