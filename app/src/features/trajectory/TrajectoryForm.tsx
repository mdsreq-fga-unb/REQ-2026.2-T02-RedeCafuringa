import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatPhone } from "@/features/register/validators";
import type { PixKeyType } from "@/features/payments/pixCode";
import { VideoUrlField } from "@/features/video/VideoUrlField";
import {
    PIX_RECEIVER_MAX,
    TEXT_LIMIT,
    validateTrajectory,
} from "./trajectoryModel";
import type { TrajectoryDraft, TrajectoryErrors } from "./trajectoryModel";
import "./trajectory.css";

const PIX_KEY_OPTIONS: ReadonlyArray<[PixKeyType, string]> = [
    ["cpf", "CPF"],
    ["cnpj", "CNPJ"],
    ["telefone", "Telefone"],
    ["email", "E-mail"],
    ["aleatoria", "Chave aleatória"],
];

type Props = {
    draft: TrajectoryDraft;
    onChange: (draft: TrajectoryDraft) => void;
    onSubmit: () => Promise<void>;
    onBack: () => void;
    signup?: boolean;
    loading?: boolean;
    focusContact?: boolean;
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
    focusContact = false,
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
    const [draggingPhoto, setDraggingPhoto] = useState(false);
    // Trocar a chave recria o campo de arquivo, limpando a seleção.
    const [photoInputKey, setPhotoInputKey] = useState(0);
    const id = useId();
    const form = useRef<HTMLFormElement>(null);
    const successDialog = useRef<HTMLDialogElement>(null);
    const submitting = useRef(false);
    useEffect(() => {
        if (focusContact && !loading && !loadFailed)
            form.current
                ?.querySelector<HTMLInputElement>(
                    '[data-trajectory-field="phone"]',
                )
                ?.focus();
    }, [focusContact, loading, loadFailed]);
    useEffect(() => {
        const dialog = successDialog.current;
        if (!dialog) return;
        if (saved) dialog.showModal();
        else if (dialog.open) dialog.close();
    }, [saved]);
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
                        `[data-trajectory-field="${key}"], [name="${key}"]`,
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
                        História e atuação da produtora
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
                        <VideoUrlField
                            id={`${id}-videoUrl`}
                            description="Conte sua história em vídeo: a família, a propriedade e o dia a dia. O vídeo aparece no seu perfil público."
                            value={draft.videoUrl}
                            error={errors.videoUrl}
                            onChange={(value) => change("videoUrl", value)}
                        />
                    </div>
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
                            value={formatPhone(draft.phone)}
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
                        <label className="trajectory-contact-permission">
                            <input
                                type="checkbox"
                                checked={draft.phonePublic}
                                aria-labelledby={`${id}-contact-title`}
                                aria-describedby={`${id}-contact-description`}
                                onChange={(event) =>
                                    change("phonePublic", event.target.checked)
                                }
                            />
                            <span className="trajectory-contact-copy">
                                <strong id={`${id}-contact-title`}>
                                    Autorizo compartilhar meu número de WhatsApp
                                </strong>
                                <span id={`${id}-contact-description`}>
                                    Marque e salve para permitir que pessoas
                                    conectadas entrem em contato pelo WhatsApp
                                    no seu perfil e nas suas ofertas.
                                </span>
                                <span className="trajectory-contact-state">
                                    {draft.phonePublic
                                        ? "Compartilhamento marcado"
                                        : "Compartilhamento desmarcado"}
                                </span>
                            </span>
                        </label>
                    </div>
                    <fieldset
                        className="trajectory-field trajectory-pix"
                        aria-describedby={`${id}-pix-notice`}
                    >
                        <legend className="field-label">
                            Pix para receber o sinal
                        </legend>
                        <p
                            className="trajectory-pix-notice"
                            id={`${id}-pix-notice`}
                        >
                            A chave aparece só para quem tiver uma pré-reserva
                            aceita com você, para pagar o sinal. Ela nunca
                            aparece no seu perfil público.
                        </p>
                        <label
                            className="field-label"
                            htmlFor={`${id}-pixType`}
                        >
                            Tipo da chave Pix
                        </label>
                        <select
                            id={`${id}-pixType`}
                            data-trajectory-field="pixType"
                            className="text-input"
                            value={draft.pixType}
                            onChange={(event) =>
                                change(
                                    "pixType",
                                    event.target.value as PixKeyType | "",
                                )
                            }
                            aria-invalid={Boolean(errors.pixType)}
                            aria-describedby={errorId("pixType")}
                        >
                            <option value="">Sem chave Pix</option>
                            {PIX_KEY_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {errors.pixType && (
                            <p
                                className="field-error"
                                role="alert"
                                id={errorId("pixType")}
                            >
                                {errors.pixType}
                            </p>
                        )}
                        <label className="field-label" htmlFor={`${id}-pixKey`}>
                            Chave Pix
                        </label>
                        <input
                            id={`${id}-pixKey`}
                            data-trajectory-field="pixKey"
                            className="text-input"
                            autoComplete="off"
                            spellCheck={false}
                            value={draft.pixKey}
                            onChange={(event) =>
                                change("pixKey", event.target.value)
                            }
                            aria-invalid={Boolean(errors.pixKey)}
                            aria-describedby={errorId("pixKey")}
                        />
                        {errors.pixKey && (
                            <p
                                className="field-error"
                                role="alert"
                                id={errorId("pixKey")}
                            >
                                {errors.pixKey}
                            </p>
                        )}
                        <label
                            className="field-label"
                            htmlFor={`${id}-pixReceiver`}
                        >
                            Nome de quem recebe o Pix
                        </label>
                        <input
                            id={`${id}-pixReceiver`}
                            data-trajectory-field="pixReceiver"
                            className="text-input"
                            autoComplete="name"
                            maxLength={PIX_RECEIVER_MAX}
                            value={draft.pixReceiver}
                            onChange={(event) =>
                                change("pixReceiver", event.target.value)
                            }
                            aria-invalid={Boolean(errors.pixReceiver)}
                            aria-describedby={errorId("pixReceiver")}
                        />
                        {errors.pixReceiver && (
                            <p
                                className="field-error"
                                role="alert"
                                id={errorId("pixReceiver")}
                            >
                                {errors.pixReceiver}
                            </p>
                        )}
                        <label className="trajectory-contact-permission">
                            <input
                                type="checkbox"
                                checked={draft.pixPublic}
                                onChange={(event) =>
                                    change("pixPublic", event.target.checked)
                                }
                            />
                            <span className="trajectory-contact-copy">
                                <strong>
                                    Mostrar minha chave Pix a quem tiver
                                    pré-reserva aceita
                                </strong>
                            </span>
                        </label>
                    </fieldset>
                    <div className="trajectory-field">
                        <label className="field-label" htmlFor={`${id}-photo`}>
                            Adicionar foto (opcional)
                        </label>
                        <div
                            className={`trajectory-photo-picker${draggingPhoto ? " is-dragging" : ""}`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                if (loading || busy || loadFailed) return;
                                event.dataTransfer.dropEffect = "copy";
                                setDraggingPhoto(true);
                            }}
                            onDragLeave={(event) => {
                                if (
                                    !event.currentTarget.contains(
                                        event.relatedTarget as Node | null,
                                    )
                                ) {
                                    setDraggingPhoto(false);
                                }
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                setDraggingPhoto(false);
                                if (loading || busy || loadFailed) return;
                                const file = event.dataTransfer.files[0];
                                if (!file) return;
                                const photoError = validateTrajectory({
                                    ...draft,
                                    photo: file,
                                }).photo;
                                if (photoError) {
                                    setErrors((current) => ({
                                        ...current,
                                        photo: photoError,
                                    }));
                                    return;
                                }
                                setPhotoInputKey((current) => current + 1);
                                change("photo", file);
                            }}
                        >
                            <input
                                // Recria o campo (limpa a seleção) ao remover
                                // a foto ou quando a enviada passa a ser a atual.
                                key={`${photoInputKey}:${draft.photoUrl}`}
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
                            <span
                                className="trajectory-photo-prompt"
                                aria-hidden="true"
                            >
                                {draggingPhoto
                                    ? "Solte a imagem aqui"
                                    : "Arraste uma imagem aqui ou clique para selecionar"}
                            </span>
                        </div>
                        {draft.photo && (
                            <p className="trajectory-photo-name">
                                {draft.photo.name}
                            </p>
                        )}
                        {(draft.photo || draft.photoUrl) && (
                            <div className="trajectory-photo-selection">
                                {(draft.photo ? preview : draft.photoUrl) && (
                                    <img
                                        className="trajectory-photo-preview"
                                        src={
                                            draft.photo
                                                ? preview
                                                : draft.photoUrl
                                        }
                                        alt={
                                            draft.photo
                                                ? "Prévia da foto selecionada"
                                                : "Sua foto de perfil atual"
                                        }
                                        decoding="async"
                                    />
                                )}
                                <button
                                    className="trajectory-photo-remove"
                                    type="button"
                                    aria-label="Remover foto"
                                    onClick={() => {
                                        setPreview("");
                                        setPhotoInputKey((value) => value + 1);
                                        onChange({
                                            ...draft,
                                            photo: null,
                                            photoUrl: "",
                                            removePhoto:
                                                draft.removePhoto ||
                                                Boolean(draft.photoUrl),
                                        });
                                        setErrors((current) => ({
                                            ...current,
                                            photo: undefined,
                                        }));
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 3v7m4-7v7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <p
                            className="trajectory-photo-help"
                            id={`${id}-photo-help`}
                        >
                            PNG, JPEG ou WebP. Ao salvar, a foto é reduzida e
                            enviada sem dados de localização, e aparece no
                            perfil público.
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
            {saved && (
                <dialog
                    ref={successDialog}
                    className="trajectory-success-dialog"
                    aria-labelledby={`${id}-success-title`}
                    aria-describedby={`${id}-success-description`}
                >
                    <span
                        className="trajectory-success-icon"
                        aria-hidden="true"
                    >
                        ✓
                    </span>
                    <h2 id={`${id}-success-title`}>
                        Trajetória salva com sucesso!
                    </h2>
                    <p id={`${id}-success-description`} role="status">
                        Suas alterações foram salvas. Sua história e suas
                        informações já estão atualizadas no perfil público.
                    </p>
                    <div className="trajectory-success-actions">
                        {publicUrl && onNavigate && (
                            <ActionButton
                                variant="outline"
                                type="button"
                                onClick={() => onNavigate(publicUrl)}
                            >
                                Ver perfil público
                            </ActionButton>
                        )}
                        <ActionButton
                            variant="orange"
                            type="button"
                            onClick={() => successDialog.current?.close()}
                        >
                            Continuar editando
                        </ActionButton>
                    </div>
                </dialog>
            )}
        </section>
    );
}
