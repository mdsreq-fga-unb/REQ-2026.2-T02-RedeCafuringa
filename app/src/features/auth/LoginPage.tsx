import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import type { Role } from "../../shared/types";

type LoginPageProps = {
    loginName: string;
    onLoginNameChange: (name: string) => void;
    onNavigate: (path: string) => void;
    onSignIn: (role: Role) => void;
};

export function LoginPage({
    loginName,
    onLoginNameChange,
    onNavigate,
    onSignIn,
}: LoginPageProps) {
    return (
        <section className="login-page">
            <BackButton label="Voltar" onClick={() => onNavigate("/perfil")} />
            <p className="eyebrow">Acesso de demonstração</p>
            <h1>Entre para falar com o responsável</h1>
            <p className="body-copy">
                Acesse sua conta para continuar para o WhatsApp.
            </p>
            <label className="field-label" htmlFor="consumer-name">
                Seu nome
            </label>
            <input
                id="consumer-name"
                className="text-input"
                value={loginName}
                onChange={(event) => onLoginNameChange(event.target.value)}
                placeholder="Como podemos chamar você?"
            />
            <div className="login-actions">
                <ActionButton
                    variant="orange"
                    onClick={() => onSignIn("consumer")}
                >
                    Entrar como consumidor
                </ActionButton>
                <ActionButton
                    variant="outline"
                    onClick={() => onSignIn("producer")}
                >
                    Entrar como responsável
                </ActionButton>
            </div>
            <p className="demo-note">Acesso demonstrativo neste navegador.</p>
        </section>
    );
}
