import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import { canStartWhatsAppContact } from "../contact/contact-flow.js";
import { producerName } from "../offers/offerData";
import type { ContactSettings, Role } from "../../shared/types";

type AccountPageProps = {
    role: Role | null;
    consumerName: string;
    settings: ContactSettings;
    draft: ContactSettings;
    saved: boolean;
    onDraftChange: (draft: ContactSettings) => void;
    onSavedChange: (saved: boolean) => void;
    onSaveContact: (event: FormEvent<HTMLFormElement>) => void;
    onNavigate: (path: string) => void;
    onSignOut: () => void;
};

export function AccountPage(props: AccountPageProps) {
    const {
        role,
        consumerName,
        settings,
        draft,
        saved,
        onDraftChange,
        onSavedChange,
        onSaveContact,
        onNavigate,
        onSignOut,
    } = props;
    const contactReady = canStartWhatsAppContact(
        "consumer",
        settings.authorized,
        settings.whatsappNumber,
    );

    return (
        <section className="account-page">
            <BackButton
                label="Explorar"
                onClick={() => onNavigate("/perfil")}
            />
            <p className="eyebrow">Conta de demonstração</p>
            <h1>
                {role === "producer"
                    ? producerName
                    : consumerName || "Visitante"}
            </h1>
            <p className="body-copy">
                {role === "producer"
                    ? "Responsável pelo perfil e pelas ofertas."
                    : "Consumidor da Rede Cafuringa."}
            </p>
            {role === "producer" && (
                <form className="contact-settings" onSubmit={onSaveContact}>
                    <h2>Contato público</h2>
                    <p className="body-copy">
                        Informe o WhatsApp que poderá ser divulgado no seu
                        perfil e nas ofertas.
                    </p>
                    <label className="field-label" htmlFor="whatsapp-number">
                        WhatsApp com código do país
                    </label>
                    <input
                        id="whatsapp-number"
                        className="text-input"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={draft.whatsappNumber}
                        onChange={(event) => {
                            onDraftChange({
                                ...draft,
                                whatsappNumber: event.target.value,
                            });
                            onSavedChange(false);
                        }}
                        placeholder="5561999999999"
                    />
                    <label className="consent-row">
                        <input
                            type="checkbox"
                            checked={draft.authorized}
                            onChange={(event) => {
                                onDraftChange({
                                    ...draft,
                                    authorized: event.target.checked,
                                });
                                onSavedChange(false);
                            }}
                        />
                        <span>
                            Autorizo a divulgação deste número para contato pelo
                            WhatsApp.
                        </span>
                    </label>
                    <ActionButton variant="orange" type="submit">
                        Salvar contato
                    </ActionButton>
                    {saved && (
                        <p className="save-status" role="status">
                            {contactReady
                                ? "Contato autorizado e disponível no perfil e nas ofertas."
                                : "Contato salvo. O botão ficará oculto até que haja um número válido e autorização de divulgação."}
                        </p>
                    )}
                </form>
            )}
            <ActionButton
                variant="outline"
                onClick={() => onNavigate("/entrar")}
            >
                Trocar perfil de demonstração
            </ActionButton>
            <button className="text-action" onClick={onSignOut}>
                Sair da demonstração
            </button>
        </section>
    );
}
