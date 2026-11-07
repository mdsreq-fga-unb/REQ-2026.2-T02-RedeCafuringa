import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatPhone } from "@/features/register/validators";
import { TEXT_LIMIT, validateTrajectory } from "./trajectoryModel";
import type { TrajectoryDraft, TrajectoryErrors } from "./trajectoryModel";
import "./trajectory.css";

type Props = {
    draft: TrajectoryDraft;
    onChange: (draft: TrajectoryDraft) => void;
    onSubmit: () => Promise<void>;
    onBack: () => void;
    signup?: boolean;
    loading?: boolean;
    error?: string;
    saved?: boolean;
    loadFailed?: boolean;
    onRetryLoad?: () => void;
    publicUrl?: string;
    onNavigate?: (path: string) => void;
    backDisabled?: boolean;
};

export function TrajectoryForm({
    draft,
    onChange,
    onSubmit,
    onBack,
    signup = false,
    loading = false,
    error,
    saved,
    loadFailed,
    onRetryLoad,
    publicUrl,
    onNavigate,
    backDisabled,
}: Props) {
    const [errors, setErrors] = useState<TrajectoryErrors>({});
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState("");
    const id = useId();
    const form = useRef<HTMLFormElement>(null);
    const submitting = useRef(false);
    useEffect(() => {
        if (!draft.photo) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPreview(String(reader.result));
        reader.readAsDataURL(draft.photo);
        return () => {
            reader.onload = null;
            if (reader.readyState === FileReader.LOADING) reader.abort();
        };
    }, [draft.photo]);

    const change = <K extends keyof TrajectoryDraft>(
        key: K,
        value: TrajectoryDraft[K],
    ) => {
        if (key === "photo") setPreview("");
        onChange({ ...draft, [key]: value });
        setErrors((current) => ({ ...current, [key]: undefined }));
    };
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (submitting.current || loading || loadFailed) return;
        const nextErrors = validateTrajectory(draft);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            const key = Object.keys(nextErrors)[0];
            requestAnimationFrame(() =>
                form.current
                    ?.querySelector<HTMLElement>(
                        `[data-trajectory-field="${key}"]`,
                    )
                    ?.focus(),
            );
            return;
        }
        submitting.current = true;
        setBusy(true);
        try {
            await onSubmit();
        } finally {
            submitting.current = false;
            setBusy(false);
        }
    };
    const errorId = (key: keyof TrajectoryDraft) =>
        errors[key] ? `${id}-${key}-error` : undefined;
    return (
        <section className="trajectory-page">
            {!backDisabled && !busy && (
                <BackButton label="Voltar" onClick={onBack} />
            )}
            <h1>Conte sua história</h1>
            <p className="trajectory-notice" id={`${id}-notice`}>
                A trajetória será exibida no perfil público. Não inclua
                documentos ou dados pessoais sensíveis.
            </p>
            <form
                ref={form}
                className="trajectory-form"
                noValidate
                onSubmit={submit}
                aria-describedby={`${id}-notice`}
            >
                {backDisabled && (
                    <p className="body-copy">
                        Sua conta já foi criada. Conclua o registro da
                        trajetória nesta etapa.
                    </p>
                )}
                {error && (
                    <p className="form-alert" role="alert">
                        {error}
                    </p>
                )}
                {loading && <p role="status">Carregando sua trajetória…</p>}
                {loadFailed && (
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={onRetryLoad}
                    >
                        Tentar carregar novamente
                    </ActionButton>
                )}
                <fieldset
                    disabled={loading || busy || loadFailed}
                    className="trajectory-fields"
                >
                    <legend className="visually-hidden">
                        História e atuação do produtor
                    </legend>
                    {(
                        [
                            [
                                "story",
                                "Minha Trajetória",
                                "Conte como sua iniciativa começou, quem participa e sua relação com a região.",
                            ],
                            [
                                "activities",
                                "Produção / Experiências / Eventos",
                                "Ex.: cultivo de hortaliças, venda de cestas e visitas guiadas à propriedade.",
                            ],
                        ] as const
                    ).map(([key, label, placeholder]) => (
                        <div className="trajectory-field" key={key}>
                            <label
                                className="field-label"
                                htmlFor={`${id}-${key}`}
                            >
                                {label} <span aria-hidden="true">*</span>
                            </label>
                            <textarea
                                id={`${id}-${key}`}
                                data-trajectory-field={key}
                                className="text-input"
                                required
                                rows={3}
                                maxLength={TEXT_LIMIT}
                                value={draft[key]}
                                placeholder={placeholder}
                                onChange={(event) =>
                                    change(key, event.target.value)
                                }
                                aria-invalid={Boolean(errors[key])}
                                aria-describedby={[
                                    `${id}-${key}-count`,
                                    errorId(key),
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            />
                            <small
                                className="trajectory-count"
                                id={`${id}-${key}-count`}
                            >
                                {draft[key].length}/{TEXT_LIMIT} caracteres
                            </small>
                            {errors[key] && (
                                <p
                                    className="field-error"
                                    role="alert"
                                    id={errorId(key)}
                                >
                                    {errors[key]}
                                </p>
                            )}
                        </div>
                    ))}
                    <div className="trajectory-field">
                        <label className="field-label" htmlFor={`${id}-phone`}>
                            Número de Contato
                        </label>
                        <input
                            id={`${id}-phone`}
                            data-trajectory-field="phone"
                            className="text-input"
                            type="tel"
                            autoComplete="tel-national"
                            inputMode="tel"
                            value={draft.phone}
                            placeholder="Ex.: (61) 99999-9999"
                            onChange={(event) =>
                                change("phone", formatPhone(event.target.value))
                            }
                            aria-invalid={Boolean(errors.phone)}
                            aria-describedby={errorId("phone")}
                        />
                        {errors.phone && (
                            <p
                                className="field-error"
                                role="alert"
                                id={errorId("phone")}
                            >
                                {errors.phone}
                            </p>
                        )}
                        <label className="consent-row">
                            <input
                                type="checkbox"
                                checked={draft.phonePublic}
                                onChange={(event) =>
                                    change("phonePublic", event.target.checked)
                                }
                            />
                            <span>
                                Autorizo a divulgação deste número de contato no
                                perfil público.
                            </span>
                        </label>
                    </div>
                    <div className="trajectory-field">
                        <label className="field-label" htmlFor={`${id}-photo`}>
                            Adicionar foto (opcional)
                        </label>
                        <div className="trajectory-photo-picker">
                            <input
                                id={`${id}-photo`}
                                data-trajectory-field="photo"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(event) =>
                                    change(
                                        "photo",
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                aria-invalid={Boolean(errors.photo)}
                                aria-describedby={[
                                    `${id}-photo-help`,
                                    errorId("photo"),
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            />
                            <span
                                className="trajectory-photo-add"
                                aria-hidden="true"
                            >
                                +
                            </span>
                        </div>
                        {draft.photo && (
                            <p className="trajectory-photo-name">
                                {draft.photo.name}
                            </p>
                        )}
                        {preview && (
                            <img
                                className="trajectory-photo-preview"
                                src={preview}
                                alt="Prévia da foto selecionada"
                            />
                        )}
                        <p
                            className="trajectory-photo-help"
                            id={`${id}-photo-help`}
                        >
                            A foto selecionada é uma prévia nesta sessão. O
                            envio e a publicação da imagem ainda não estão
                            disponíveis.
                        </p>
                        {errors.photo && (
                            <p
                                className="field-error"
                                role="alert"
                                id={errorId("photo")}
                            >
                                {errors.photo}
                            </p>
                        )}
                    </div>
                </fieldset>
                <ActionButton
                    variant="orange"
                    type="submit"
                    disabled={loading || busy || loadFailed}
                >
                    {busy
                        ? signup
                            ? "Criando conta…"
                            : "Salvando…"
                        : signup
                          ? "Criar conta"
                          : "Salvar trajetória"}
                </ActionButton>
                {saved && (
                    <p className="save-status" role="status">
                        Trajetória salva com sucesso.
                    </p>
                )}
                {saved && publicUrl && onNavigate && (
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => onNavigate(publicUrl)}
                    >
                        Ver perfil público
                    </ActionButton>
                )}
            </form>
        </section>
    );
}
