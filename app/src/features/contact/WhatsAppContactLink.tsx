import { ActionButton } from "../../components/ui/ActionButton";

/**
 * HU39: opção de contato direto pelo WhatsApp.
 *
 * Para quem está autenticado é um link comum para o wa.me (não um botão com
 * window.open): abre em nova aba sem enviar a origem (noopener noreferrer) e
 * sem bloqueio de pop-up. A conversa acontece fora do app (RN17).
 *
 * RN17: só usuário autenticado inicia o contato. Com `onRequireLogin`
 * (visitante), a mesma opção aparece (CA01, CA05), mas é um botão que leva ao
 * login, sem colocar o link do wa.me na página.
 */
export function WhatsAppContactLink({
    url,
    onRequireLogin,
}: {
    url: string;
    onRequireLogin?: () => void;
}) {
    if (onRequireLogin)
        return (
            <ActionButton
                variant="green"
                onClick={onRequireLogin}
                aria-label="Conversar pelo WhatsApp (entre na sua conta para continuar)"
            >
                Conversar pelo WhatsApp
            </ActionButton>
        );
    return (
        <a
            className="button button-green"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Conversar pelo WhatsApp (abre em nova aba)"
        >
            Conversar pelo WhatsApp
        </a>
    );
}
