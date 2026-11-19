import { AccountEditButton } from "./AccountEditButton";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import {
    readMockProducerAccount,
    updateMockProducerAccount,
} from "@/features/auth/mockAuth";
import { PAYMENT_METHOD_OPTIONS } from "@/features/register/registerForm";
import { getApiClient } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import type { AuthResult } from "@/shared/types";

type ProducerAccount = components["schemas"]["ProducerAccountDto"];
type Props = { userId: AuthResult["user"]["id"] };

const categories: ProducerAccount["categoriaOfertada"][] = [
    "Produtos",
    "Experiências",
    "Produtos e Experiências",
];

const accountPath = "/users/producers/me";

function accountHeaders() {
    const token = localStorage.getItem("cafuringa-token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function ProducerAccountForm({ userId }: Props) {
    const [details, setDetails] = useState<ProducerAccount | undefined>(() => {
        if (!isMockAuthEnabled) return undefined;
        const profile = readMockProducerAccount(userId);
        return {
            nomeIniciativa: profile?.nomeIniciativa ?? "",
            categoriaOfertada: profile?.categoriaOfertada ?? "Produtos",
            formasPagamento: profile?.formasPagamento ?? [],
        };
    });
    const [draft, setDraft] = useState<ProducerAccount | null>(null);
    const editing = draft !== null;
    const [error, setError] = useState("");
    const [loadingAttempt, setLoadingAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isMockAuthEnabled) return;
        const controller = new AbortController();
        void getApiClient()
            .get<ProducerAccount>(accountPath, {
                headers: accountHeaders(),
                signal: controller.signal,
            })
            .then((profile) => {
                if (!controller.signal.aborted) setDetails(profile);
            })
            .catch(() => {
                if (!controller.signal.aborted)
                    setError("Não foi possível carregar os dados da conta.");
            });
        return () => controller.abort();
    }, [userId, loadingAttempt]);

    const initiative = useRef<HTMLInputElement>(null);
    const editButton = useRef<HTMLButtonElement>(null);
    const wasEditing = useRef(false);
    useEffect(() => {
        if (editing) initiative.current?.focus();
        else if (wasEditing.current) editButton.current?.focus();
        wasEditing.current = editing;
    }, [editing]);

    if (!details) {
        return error ? (
            <div className="account-profile-form">
                <p role="alert">{error}</p>
                <ActionButton
                    variant="outline"
                    onClick={() => {
                        setError("");
                        setLoadingAttempt((value) => value + 1);
                    }}
                >
                    Tentar novamente
                </ActionButton>
            </div>
        ) : (
            <p role="status">Carregando dados da conta…</p>
        );
    }

    const update = (changes: Partial<ProducerAccount>) => {
        setDraft((current) => current && { ...current, ...changes });
        setSaved(false);
        setError("");
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!draft || saving) return;
        const data = {
            ...draft,
            nomeIniciativa: draft.nomeIniciativa.trim(),
        };
        if (!data.nomeIniciativa || !data.formasPagamento.length) {
            setError(
                "Informe o nome da iniciativa e selecione ao menos uma forma de pagamento.",
            );
            return;
        }
        setSaving(true);
        setError("");
        try {
            if (isMockAuthEnabled) updateMockProducerAccount(userId, data);
            else
                await getApiClient().put(accountPath, data, {
                    headers: accountHeaders(),
                });
            setDetails(data);
            setDraft(null);
            setSaved(true);
        } catch {
            setError(
                "Não foi possível salvar os dados da conta. Tente novamente.",
            );
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setDraft(null);
        setError("");
    };
    const paymentOptions = [
        ...new Set([...PAYMENT_METHOD_OPTIONS, ...details.formasPagamento]),
    ];
    return (
        <section
            className="account-details-card producer-account-details"
            aria-labelledby="producer-details-heading"
        >
            <div className="producer-account-heading">
                <h2 id="producer-details-heading">Dados da iniciativa</h2>
                {!draft && (
                    <AccountEditButton
                        action="edit"
                        label="Editar dados da iniciativa"
                        ref={editButton}
                        onClick={() => {
                            setSaved(false);
                            setDraft(details);
                        }}
                    />
                )}
            </div>
            {draft ? (
                <form
                    className="account-profile-form"
                    onSubmit={save}
                    aria-busy={saving}
                    onKeyDown={(event) => {
                        if (event.key === "Escape" && !saving) cancel();
                    }}
                >
                    <div className="account-field">
                        <label
                            className="field-label"
                            htmlFor="producer-initiative"
                        >
                            Nome da iniciativa <span aria-hidden="true">*</span>
                        </label>
                        <input
                            ref={initiative}
                            id="producer-initiative"
                            className="text-input"
                            value={draft.nomeIniciativa}
                            placeholder="Ex.: Sítio Raízes"
                            maxLength={120}
                            required
                            disabled={saving}
                            onChange={(event) =>
                                update({ nomeIniciativa: event.target.value })
                            }
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
                            value={draft.categoriaOfertada}
                            disabled={saving}
                            onChange={(event) => {
                                const category = categories.find(
                                    (value) => value === event.target.value,
                                );
                                if (category)
                                    update({ categoriaOfertada: category });
                            }}
                        >
                            {categories.map((category) => (
                                <option key={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    <fieldset
                        className="account-payment-methods choice-group"
                        disabled={saving}
                    >
                        <legend className="field-label field-label-required">
                            Formas de pagamento
                        </legend>
                        {paymentOptions.map((option) => (
                            <label className="choice-option" key={option}>
                                <input
                                    type="checkbox"
                                    checked={draft.formasPagamento.includes(
                                        option,
                                    )}
                                    onChange={(event) =>
                                        update({
                                            formasPagamento: event.target
                                                .checked
                                                ? [
                                                      ...draft.formasPagamento,
                                                      option,
                                                  ]
                                                : draft.formasPagamento.filter(
                                                      (value) =>
                                                          value !== option,
                                                  ),
                                        })
                                    }
                                />
                                {option}
                            </label>
                        ))}
                    </fieldset>
                    <div className="producer-account-edit-actions">
                        <AccountEditButton
                            action="save"
                            label={
                                saving
                                    ? "Salvando dados da iniciativa"
                                    : "Salvar dados da iniciativa"
                            }
                            disabled={saving}
                        />
                        <AccountEditButton
                            action="cancel"
                            label="Cancelar edição"
                            disabled={saving}
                            onClick={cancel}
                        />
                    </div>
                </form>
            ) : (
                <dl>
                    <div>
                        <dt>Nome da iniciativa</dt>
                        <dd>{details.nomeIniciativa || "Não informado"}</dd>
                    </div>
                    <div>
                        <dt>Categoria</dt>
                        <dd>{details.categoriaOfertada}</dd>
                    </div>
                    <div>
                        <dt>Formas de pagamento</dt>
                        <dd>
                            {details.formasPagamento.join(", ") ||
                                "Não informadas"}
                        </dd>
                    </div>
                </dl>
            )}
            {error && (
                <p className="form-alert" role="alert">
                    {error}
                </p>
            )}
            {saved && (
                <p className="save-status" role="status">
                    Alterações salvas.
                </p>
            )}
        </section>
    );
}
