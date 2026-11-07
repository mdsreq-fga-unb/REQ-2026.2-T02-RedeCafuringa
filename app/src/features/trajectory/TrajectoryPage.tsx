import { useEffect, useRef, useState } from "react";
import { emptyTrajectory, trajectoryBody } from "./trajectoryModel";
import type { TrajectoryDraft } from "./trajectoryModel";
import {
    getOwnTrajectory,
    photoError,
    photoSrc,
    saveTrajectory,
    syncPhoto,
    trajectoryError,
} from "./trajectoryService";
import { TrajectoryForm } from "./TrajectoryForm";

export function TrajectoryPage({
    onNavigate,
    userId,
}: {
    onNavigate: (path: string) => void;
    userId: string | null;
}) {
    const [draft, setDraft] = useState<TrajectoryDraft>(emptyTrajectory);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const active = useRef(true);
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        void getOwnTrajectory(controller.signal)
            .then((data) => {
                if (controller.signal.aborted) return;
                setDraft({
                    ...emptyTrajectory,
                    story: data.trajetoria ?? "",
                    activities: data.atividades ?? "",
                    phone: data.telefone ?? "",
                    phonePublic: data.telefonePublico,
                    photoUrl: photoSrc(data.fotoUrl),
                });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) return;
                setError(trajectoryError(cause, true));
                setLoadFailed(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [attempt]);

    const save = async () => {
        setError("");
        setSaved(false);
        try {
            await saveTrajectory(trajectoryBody(draft));
        } catch (cause) {
            if (active.current) setError(trajectoryError(cause));
            return;
        }
        // A foto vai depois dos textos: se falhar, a trajetória já está salva
        // e a seleção continua no formulário para tentar de novo (CA07).
        try {
            const photoUrl = await syncPhoto(draft);
            if (!active.current) return;
            if (photoUrl !== undefined)
                setDraft((current) => ({
                    ...current,
                    photo: null,
                    removePhoto: false,
                    photoUrl,
                }));
            setSaved(true);
        } catch (cause) {
            if (active.current)
                setError(
                    `A trajetória foi salva, mas ${photoError(cause, !draft.photo)}`,
                );
        }
    };
    return (
        <TrajectoryForm
            draft={draft}
            onChange={(next) => {
                setDraft(next);
                setSaved(false);
            }}
            onSubmit={save}
            onBack={() => onNavigate("/conta")}
            loading={loading}
            error={error}
            saved={saved}
            loadFailed={loadFailed}
            onRetryLoad={() => {
                setLoading(true);
                setError("");
                setLoadFailed(false);
                setAttempt((value) => value + 1);
            }}
            onNavigate={onNavigate}
            publicUrl={
                userId ? `/produtor/${encodeURIComponent(userId)}` : undefined
            }
        />
    );
}
