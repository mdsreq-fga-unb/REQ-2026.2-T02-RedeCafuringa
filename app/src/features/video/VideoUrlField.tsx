import { VideoEmbed } from "./VideoEmbed";
import { extractYoutubeId } from "./youtube";
import "./video.css";

type Props = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    /** Orientação do formulário, que valida no envio (validateVideoUrl). */
    error?: string;
    disabled?: boolean;
    /** Para que serve o vídeo nesta tela; aparece antes da dica de formato. */
    description?: string;
};

/** Link opcional de vídeo do YouTube, com prévia quando o link é válido. */
export function VideoUrlField({
    id,
    value,
    onChange,
    error,
    disabled,
    description,
}: Props) {
    const descriptionId = `${id}-description`;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const videoId = extractYoutubeId(value);
    return (
        <div className="video-url-field">
            <label className="field-label" htmlFor={id}>
                Vídeo do YouTube (opcional)
            </label>
            {description && (
                <p className="video-url-description" id={descriptionId}>
                    {description}
                </p>
            )}
            <p className="video-url-hint" id={hintId}>
                Cole o link do vídeo, por exemplo https://youtu.be/…
            </p>
            <input
                id={id}
                name="videoUrl"
                className="text-input"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={[
                    description && descriptionId,
                    hintId,
                    error && errorId,
                ]
                    .filter(Boolean)
                    .join(" ")}
            />
            {error && (
                <p className="field-error" id={errorId} role="alert">
                    {error}
                </p>
            )}
            {videoId && (
                <VideoEmbed
                    videoId={videoId}
                    title="prévia do link informado"
                />
            )}
        </div>
    );
}
