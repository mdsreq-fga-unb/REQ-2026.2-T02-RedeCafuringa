import { useEffect, useState } from "react";
import {
    getOwnTrajectory,
    photoSrc,
} from "@/features/trajectory/trajectoryService";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import { formatCpf } from "../auth/cpf";
import { isMockAuthEnabled } from "../auth/authMode";
import { isWhatsAppContactAvailable } from "../contact/contact-flow.js";
import { producerName } from "../offers/offerData";
import { ProducerAccountForm } from "./ProducerAccountForm";
import type { AuthResult, ContactSettings, Role } from "../../shared/types";

type AccountPageProps = {
    role: Role | null;
    userId?: AuthResult["user"]["id"] | null;
    consumerName: string;
    consumerEmail?: string;
    consumerCpf?: string;
    settings: ContactSettings;
    draft: ContactSettings;
    saved: boolean;
    onDraftChange: (draft: ContactSettings) => void;
    onSavedChange: (saved: boolean) => void;
    onSaveContact: (event: FormEvent<HTMLFormElement>) => void;
    onNavigate: (path: string) => void;
    onSignOut: () => void;
    /**
     * HU39/CA03: na demonstração (sem API) o contato fica no aparelho. Com a
     * API real, a autorização é gravada em "Minha trajetória" (HU12), que é a
     * fonte do contato público; a Conta só aponta para lá.
     */
    demoContact?: boolean;
};

function ProducerAvatar({ name }: { name: string }) {
    const [source, setSource] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        void getOwnTrajectory(controller.signal)
            .then(({ fotoUrl }) => {
                if (!controller.signal.aborted) setSource(photoSrc(fotoUrl));
            })
            .catch(() => {
                // Mantém a inicial quando a foto não está disponível.
            });
        return () => controller.abort();
    }, []);

    return source ? (
        <img
            className="account-avatar"
            src={source}
            alt="Sua foto de perfil"
            onError={() => setSource("")}
        />
    ) : (
        <span className="account-avatar" aria-hidden="true">
            {name.charAt(0).toLocaleUpperCase("pt-BR")}
        </span>
    );
}

export function AccountPage(props: AccountPageProps) {
    const {
        role,
        userId,
        consumerName,
        consumerEmail = "",
        consumerCpf = "",
        settings,
        draft,
        saved,
        onDraftChange,
        onSavedChange,
        onSaveContact,
        onNavigate,
        onSignOut,
        demoContact = isMockAuthEnabled,
    } = props;
    const contactReady = isWhatsAppContactAvailable(
        settings.authorized,
        settings.whatsappNumber,
    );
    const displayName =
        role === "producer"
            ? (consumerName || producerName)
                  .replace(/^Dona\s+/i, "")
                  .split(/\s+/)[0]
            : (consumerName || "Visitante").split(/\s+/)[0];

    return (
        <section className="account-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            {role === "producer" && userId != null && (
                <ProducerAvatar key={userId} name={displayName} />
            )}
            <h1>Olá, {displayName}</h1>
            <p className="eyebrow">
                {role === "producer"
                    ? "Produtora"
                    : role === "admin"
                      ? "Administradora"
                      : "Consumidora"}
            </p>
            {role === "producer" && (
                <>
                    {userId != null && (
                        <ProducerAccountForm key={userId} userId={userId} />
                    )}
                    <section
                        className="public-contact-card account-contact-card"
                        aria-labelledby="account-contact-heading"
                    >
                        <div>
                            <h2 id="account-contact-heading">
                                Contato público
                            </h2>
                            <p>
                                Receba perguntas sobre seus produtos e
                                experiências pelo WhatsApp.
                            </p>
                        </div>
                        {!demoContact && (
                            <div className="public-contact-actions">
                                <p>
                                    Cadastre o número e autorize a divulgação em
                                    Minha trajetória.
                                </p>
                                <ActionButton
                                    variant="outline"
                                    onClick={() =>
                                        onNavigate(
                                            "/minha-trajetoria?contato=1",
                                        )
                                    }
                                >
                                    Configurar contato público{" "}
                                    <span aria-hidden="true">→</span>
                                </ActionButton>
                            </div>
                        )}
                        {demoContact && (
                            <form
                                className="contact-settings"
                                onSubmit={onSaveContact}
                            >
                                <p className="contact-name">
                                    {contactReady
                                        ? "WhatsApp disponível no perfil e nas ofertas"
                                        : "WhatsApp oculto no perfil e nas ofertas"}
                                </p>
                                <label
                                    className="field-label"
                                    htmlFor="whatsapp-number"
                                >
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
                                    placeholder="Ex.: 5561999999999"
                                />
                                <label className="consent-row">
                                    <input
                                        type="checkbox"
                                        checked={draft.authorized}
                                        onChange={(event) => {
                                            onDraftChange({
                                                ...draft,
                                                authorized:
                                                    event.target.checked,
                                            });
                                            onSavedChange(false);
                                        }}
                                    />
                                    <span>
                                        Autorizo a divulgação deste número para
                                        contato pelo WhatsApp.
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
                    </section>
                </>
            )}
            {role === "consumer" && (
                <div className="account-profile-form account-consumer-fields">
                    <div className="account-field">
                        <label className="field-label" htmlFor="consumer-email">
                            E-mail <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id="consumer-email"
                            placeholder="E-mail não disponível"
                            className="text-input"
                            type="email"
                            value={consumerEmail}
                            aria-label="E-mail"
                            readOnly
                        />
                    </div>
                    <div className="account-field">
                        <label className="field-label" htmlFor="consumer-cpf">
                            CPF <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id="consumer-cpf"
                            placeholder="CPF não disponível"
                            className="text-input"
                            value={
                                consumerCpf.includes("*")
                                    ? consumerCpf
                                    : formatCpf(consumerCpf)
                            }
                            aria-label="CPF"
                            readOnly
                        />
                    </div>
                    <ActionButton
                        variant="orange"
                        onClick={() => onNavigate("/login/producer")}
                    >
                        Acessar como produtora
                    </ActionButton>
                </div>
            )}
            {role === "admin" && (
                <div className="account-profile-form">
                    <ActionButton
                        variant="orange"
                        onClick={() => onNavigate("/admin/usuarios")}
                    >
                        Usuárias cadastradas
                    </ActionButton>
                    <ActionButton
                        variant="outline"
                        onClick={() => onNavigate("/cadastro/administrador")}
                    >
                        Cadastrar administradora
                    </ActionButton>
                </div>
            )}
            <button className="button button-danger" onClick={onSignOut}>
                Sair da conta
            </button>
        </section>
    );
}
