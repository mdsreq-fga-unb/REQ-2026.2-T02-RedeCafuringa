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
            <div
                className={
                    role === "consumer" ? "consumer-account-header" : undefined
                }
            >
                {role === "consumer" && (
                    <span className="account-avatar" aria-hidden="true">
                        {displayName.charAt(0).toLocaleUpperCase("pt-BR")}
                    </span>
                )}
                <div>
                    <h1>Olá, {displayName}</h1>
                    <p className="eyebrow">
                        {role === "producer"
                            ? "Produtora"
                            : role === "admin"
                              ? "Administradora"
                              : "Consumidora"}
                    </p>
                </div>
            </div>
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
                <div className="consumer-account-content">
                    <section
                        className="consumer-account-details"
                        aria-labelledby="consumer-details-heading"
                    >
                        <h2 id="consumer-details-heading">Dados da conta</h2>
                        <dl>
                            <div>
                                <dt>Nome</dt>
                                <dd>{consumerName || "Não informado"}</dd>
                            </div>
                            <div>
                                <dt>E-mail</dt>
                                <dd>{consumerEmail || "Não informado"}</dd>
                            </div>
                            <div>
                                <dt>CPF</dt>
                                <dd>
                                    {(consumerCpf.includes("*")
                                        ? consumerCpf
                                        : formatCpf(consumerCpf)) ||
                                        "Não informado"}
                                </dd>
                            </div>
                        </dl>
                    </section>
                    <section
                        className="public-contact-card consumer-account-explore"
                        aria-labelledby="consumer-explore-heading"
                    >
                        <div>
                            <h2 id="consumer-explore-heading">
                                Explore a Cafuringa
                            </h2>
                            <p>
                                Conheça os produtos e as experiências das
                                produtoras locais.
                            </p>
                        </div>
                        <div className="public-contact-actions">
                            <ActionButton
                                variant="outline"
                                onClick={() => onNavigate("/produtos")}
                            >
                                Ver produtos
                            </ActionButton>
                            <ActionButton
                                variant="outline"
                                onClick={() => onNavigate("/experiencias")}
                            >
                                Ver experiências
                            </ActionButton>
                        </div>
                    </section>
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
