import { useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../components/ui/ActionButton";
import { BackButton } from "../../components/navigation/BackButton";
import { formatCpf } from "../auth/cpf";
import { canStartWhatsAppContact } from "../contact/contact-flow.js";
import { producerName } from "../offers/offerData";
import type { ContactSettings, Role } from "../../shared/types";

type AccountPageProps = {
    role: Role | null;
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
};

export function AccountPage(props: AccountPageProps) {
    const {
        role,
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
    } = props;
    const contactReady = canStartWhatsAppContact(
        "consumer",
        settings.authorized,
        settings.whatsappNumber,
    );
    const [initiative, setInitiative] = useState(
        () => localStorage.getItem("cafuringa-producer-initiative") ?? "",
    );
    const [category, setCategory] = useState(
        () => localStorage.getItem("cafuringa-producer-category") ?? "Produtos",
    );
    const [paymentMethods, setPaymentMethods] = useState(
        () =>
            localStorage.getItem("cafuringa-producer-payment-methods") ??
            "Pix, Cartão de crédito",
    );
    const [profileSaved, setProfileSaved] = useState(false);
    const displayName =
        role === "producer"
            ? (consumerName || producerName)
                  .replace(/^Dona\s+/i, "")
                  .split(/\s+/)[0]
            : (consumerName || "Visitante").split(/\s+/)[0];

    const saveProducerProfile = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        localStorage.setItem("cafuringa-producer-initiative", initiative);
        localStorage.setItem("cafuringa-producer-category", category);
        localStorage.setItem(
            "cafuringa-producer-payment-methods",
            paymentMethods,
        );
        setProfileSaved(true);
    };

    return (
        <section className="account-page">
            <BackButton label="Voltar" onClick={() => onNavigate("/perfil")} />
            <h1>Olá, {displayName}</h1>
            <p className="eyebrow">
                {role === "producer"
                    ? "Produtora"
                    : role === "admin"
                      ? "Administrador"
                      : "Consumidora"}
            </p>
            {role === "producer" && (
                <>
                    <ActionButton
                        variant="orange"
                        onClick={() => onNavigate("/minha-trajetoria")}
                    >
                        Minha trajetória
                    </ActionButton>
                    <form
                        className="account-profile-form"
                        onSubmit={saveProducerProfile}
                    >
                        <div className="account-field">
                            <label
                                className="field-label"
                                htmlFor="producer-initiative"
                            >
                                Nome da iniciativa{" "}
                                <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="producer-initiative"
                                className="text-input"
                                value={initiative}
                                aria-label="Nome da iniciativa"
                                placeholder="Flor do campo"
                                onChange={(event) => {
                                    setInitiative(event.target.value);
                                    setProfileSaved(false);
                                }}
                            />
                        </div>
                        <div className="account-field">
                            <label
                                className="field-label"
                                htmlFor="producer-category"
                            >
                                Categoria <span aria-hidden="true">*</span>
                            </label>
                            <select
                                id="producer-category"
                                className="text-input"
                                value={category}
                                onChange={(event) => {
                                    setCategory(event.target.value);
                                    setProfileSaved(false);
                                }}
                            >
                                <option>Produtos</option>
                                <option>Experiências</option>
                                <option>Produtos e experiências</option>
                            </select>
                        </div>
                        <div className="account-field">
                            <label
                                className="field-label"
                                htmlFor="producer-payment-methods"
                            >
                                Formas de pagamento{" "}
                                <span aria-hidden="true">*</span>
                            </label>
                            <select
                                id="producer-payment-methods"
                                className="text-input"
                                value={paymentMethods}
                                onChange={(event) => {
                                    setPaymentMethods(event.target.value);
                                    setProfileSaved(false);
                                }}
                            >
                                <option>Pix</option>
                                <option>Pix, Cartão de crédito</option>
                                <option>Pix, Dinheiro</option>
                                <option>
                                    Pix, Cartão de crédito, Dinheiro
                                </option>
                            </select>
                        </div>
                        <ActionButton variant="orange" type="submit">
                            Salvar
                        </ActionButton>
                        {profileSaved && (
                            <p className="save-status" role="status">
                                Alterações salvas.
                            </p>
                        )}
                    </form>
                    <details className="account-contact-disclosure">
                        <summary>Contato público</summary>
                        <form
                            className="contact-settings"
                            onSubmit={onSaveContact}
                        >
                            <h2>Contato público</h2>
                            <p className="body-copy">
                                Informe o WhatsApp que poderá ser divulgado no
                                seu perfil e nas ofertas.
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
                    </details>
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
                        Acessar como produtor
                    </ActionButton>
                </div>
            )}
            {role === "admin" && (
                <div className="account-profile-form">
                    <ActionButton
                        variant="orange"
                        onClick={() => onNavigate("/admin/usuarios")}
                    >
                        Usuários cadastrados
                    </ActionButton>
                    <ActionButton
                        variant="outline"
                        onClick={() => onNavigate("/cadastro/administrador")}
                    >
                        Cadastrar administrador
                    </ActionButton>
                </div>
            )}
            <button className="button button-danger" onClick={onSignOut}>
                Sair da conta
            </button>
        </section>
    );
}
