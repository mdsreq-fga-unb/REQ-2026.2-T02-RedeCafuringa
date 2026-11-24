import { youtubeEmbedUrl } from "./youtube";
import "./video.css";

type Props = {
    /** Id do vídeo vindo da API; inválido ou ausente não mostra nada. */
    videoId?: string | null;
    /** Nome da oferta ou do produtor, para o título acessível do vídeo. */
    title: string;
};

export function VideoEmbed({ videoId, title }: Props) {
    const src = videoId ? youtubeEmbedUrl(videoId) : null;
    if (!src) return null;
    return (
        <div className="video-embed">
            <div className="video-embed-frame">
                <iframe
                    src={src}
                    title={`Vídeo: ${title}`}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            <a
                className="video-embed-link"
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                Assistir no YouTube (abre em nova aba)
            </a>
        </div>
    );
}
