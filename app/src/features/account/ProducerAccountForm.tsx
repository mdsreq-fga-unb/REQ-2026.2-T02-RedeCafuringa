import { useEffect, useState } from "react";
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
        setDetails({ ...details, ...changes });
        setSaved(false);
        setError("");
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (saving) return;
        const data = {
            ...details,
            nomeIniciativa: details.nomeIniciativa.trim(),
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
            setSaved(true);
        } catch {
            setError(
                "Não foi possível salvar os dados da conta. Tente novamente.",
            );
        } finally {
            setSaving(false);
        }
    };

    const paymentOptions = [
        ...new Set([...PAYMENT_METHOD_OPTIONS, ...details.formasPagamento]),
    ];
    return (
        <form className="account-profile-form" onSubmit={save}>
            <div className="account-field">
                <label className="field-label" htmlFor="producer-initiative">
                    Nome da iniciativa <span aria-hidden="true">*</span>
                </label>
                <input
                    id="producer-initiative"
                    className="text-input"
                    value={details.nomeIniciativa}
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
                <label className="field-label" htmlFor="producer-category">
                    Categoria <span aria-hidden="true">*</span>
                </label>
                <select
                    id="producer-category"
                    className="text-input"
                    value={details.categoriaOfertada}
                    disabled={saving}
                    onChange={(event) => {
                        const category = categories.find(
                            (value) => value === event.target.value,
                        );
                        if (category) update({ categoriaOfertada: category });
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
                <legend className="field-label">
                    Formas de pagamento <span aria-hidden="true">*</span>
                </legend>
                {paymentOptions.map((option) => (
                    <label className="consent-row" key={option}>
                        <input
                            type="checkbox"
                            checked={details.formasPagamento.includes(option)}
                            onChange={(event) =>
                                update({
                                    formasPagamento: event.target.checked
                                        ? [...details.formasPagamento, option]
                                        : details.formasPagamento.filter(
                                              (value) => value !== option,
                                          ),
                                })
                            }
                        />
                        {option}
                    </label>
                ))}
            </fieldset>
            <ActionButton variant="orange" type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
            </ActionButton>
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
        </form>
    );
}
