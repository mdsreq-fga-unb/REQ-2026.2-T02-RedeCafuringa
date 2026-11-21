import { useEffect, useId, useRef, useState } from "react";
import { ApiHttpError } from "@/shared/api";
import {
    accountLabel,
    deleteUser,
    deletionReasons,
    profileLabels,
} from "./usersService";
import type { DeletionReason, UserDetail } from "./usersService";

type Props = {
    user: UserDetail;
    onCancel: () => void;
    onDeleted: () => void;
    onUnauthorized: () => void;
};

const FOCUSABLE =
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function failureMessage(error: unknown): string {
    if (error instanceof ApiHttpError && error.status === 404)
        return "Não foi possível excluir: a conta não existe mais ou já foi excluída.";
    if (error instanceof ApiHttpError && error.status < 500)
        return `Não foi possível excluir: ${error.message}`;
    // RNF03: falha do sistema ou da conexão não é erro de quem opera.
    return "Não foi possível excluir agora. Verifique a conexão e tente novamente; a conta não foi alterada.";
}

/**
 * Confirmação da exclusão. Modal (`alertdialog`), com o
 * foco preso dentro dele, começando em "Cancelar" (a ação segura); Esc e
 * "Cancelar" fecham sem chamar a API. O motivo é obrigatório (RN04).
 */
export function DeleteUserDialog({
    user,
    onCancel,
    onDeleted,
    onUnauthorized,
}: Props) {
    const titleId = useId();
    const descriptionId = useId();
    const reasonErrorId = useId();
    const hintId = useId();
    const dialog = useRef<HTMLDivElement>(null);
    const cancel = useRef<HTMLButtonElement>(null);
    const firstReason = useRef<HTMLInputElement>(null);
    const [motivo, setMotivo] = useState<DeletionReason>();
    const [reasonError, setReasonError] = useState(false);
    const [failure, setFailure] = useState<string>();
    const [sending, setSending] = useState(false);

    useEffect(() => {
        cancel.current?.focus();
    }, []);

    const submit = async () => {
        if (!motivo) {
            setReasonError(true);
            firstReason.current?.focus();
            return;
        }
        setSending(true);
        setFailure(undefined);
        try {
            await deleteUser(user.id, motivo);
            onDeleted();
        } catch (error) {
            if (error instanceof ApiHttpError && error.status === 401) {
                onUnauthorized();
                return;
            }
            setFailure(failureMessage(error));
            setSending(false);
        }
    };

    return (
        <div className="admin-dialog-backdrop">
            <div
                ref={dialog}
                className="admin-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onKeyDown={(event) => {
                    if (event.key === "Escape" && !sending) {
                        event.stopPropagation();
                        onCancel();
                        return;
                    }
                    if (event.key !== "Tab") return;
                    const items = [
                        ...(dialog.current?.querySelectorAll<HTMLElement>(
                            FOCUSABLE,
                        ) ?? []),
                    ];
                    const first = items[0];
                    const last = items.at(-1);
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last?.focus();
                    } else if (
                        !event.shiftKey &&
                        document.activeElement === last
                    ) {
                        event.preventDefault();
                        first?.focus();
                    }
                }}
            >
                <h2 id={titleId}>Excluir a conta de {accountLabel(user)}?</h2>
                <div id={descriptionId}>
                    <p className="admin-dialog-account">
                        {profileLabels[user.perfil]} · {user.email}
                    </p>
                    <p>
                        A exclusão é definitiva e não pode ser desfeita. A
                        pessoa perde o acesso na hora
                        {user.perfil === "PRODUTOR"
                            ? ", e o perfil público, os produtos, as experiências e as fotos saem da plataforma"
                            : ""}
                        .
                    </p>
                </div>
                <fieldset
                    className="admin-dialog-reasons"
                    aria-describedby={reasonError ? reasonErrorId : undefined}
                    aria-invalid={reasonError || undefined}
                >
                    <legend>Motivo da exclusão</legend>
                    {(
                        Object.entries(deletionReasons) as [
                            DeletionReason,
                            { label: string; hint: string },
                        ][]
                    ).map(([value, { label, hint }], index) => (
                        <div key={value} className="admin-dialog-reason">
                            <label>
                                <input
                                    ref={index === 0 ? firstReason : undefined}
                                    type="radio"
                                    name="motivo"
                                    value={value}
                                    checked={motivo === value}
                                    disabled={sending}
                                    aria-describedby={`${hintId}-${value}`}
                                    onChange={() => {
                                        setMotivo(value);
                                        setReasonError(false);
                                    }}
                                />
                                {label}
                            </label>
                            <p
                                id={`${hintId}-${value}`}
                                className="admin-dialog-hint"
                            >
                                {hint}
                            </p>
                        </div>
                    ))}
                    {reasonError && (
                        <p id={reasonErrorId} className="field-error">
                            Escolha o motivo da exclusão.
                        </p>
                    )}
                </fieldset>
                {failure && (
                    <p className="admin-dialog-failure" role="alert">
                        {failure}
                    </p>
                )}
                <div className="admin-dialog-actions">
                    <button
                        ref={cancel}
                        type="button"
                        className="button button-outline"
                        disabled={sending}
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="button button-danger"
                        disabled={sending}
                        onClick={() => void submit()}
                    >
                        {sending ? "Excluindo…" : "Excluir definitivamente"}
                    </button>
                </div>
            </div>
        </div>
    );
}
