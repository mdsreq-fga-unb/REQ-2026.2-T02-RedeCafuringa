import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { ApiHttpError } from "@/shared/api";
import { formatPhone } from "@/features/register/validators";
import { getPublicTrajectory, photoSrc } from "./trajectoryService";
import type { PublicTrajectory } from "./trajectoryService";
import { ProducerCatalogPage } from "@/features/profile/ProducerCatalogPage";
import {
    getContactLoginRoute,
    WhatsAppContactLink,
    whatsAppContactUrl,
} from "@/features/contact";
import "./trajectory.css";
import "@/features/profile/publicProfile.css";

export function PublicTrajectoryPage({
    id,
    onNavigate,
    catalogView = false,
    offerId,
    authenticated = false,
}: {
    id: string;
    onNavigate: (path: string) => void;
    catalogView?: boolean;
    offerId?: string;
    /** RN17: só quem está autenticado recebe o link do wa.me. */
    authenticated?: boolean;
}) {
    const [data, setData] = useState<PublicTrajectory | null>(null);
    const [error, setError] = useState("");
    // 404 (perfil inexistente ou não publicado) não melhora tentando de novo.
    const [retryable, setRetryable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        void getPublicTrajectory(id, controller.signal)
            .then((profile) => {
                if (!controller.signal.aborted) setData(profile);
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) return;
                const notFound =
                    cause instanceof ApiHttpError && cause.status === 404;
                setRetryable(!notFound);
                setError(
                    notFound
                        ? "Perfil indisponível ou não encontrado."
                        : "Não foi possível carregar este perfil. Verifique a conexão e tente novamente.",
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [id, attempt]);
    // HU39: o telefone só vem da API quando o produtor autorizou (RN07);
    // todos veem a opção (CA05), mas só quem está logado inicia o contato (RN17).
    const contactUrl = whatsAppContactUrl(
        data?.telefone,
        `Perfil de ${data?.nomeIniciativa || "produtor"}`,
    );
    if (data && catalogView)
        return (
            <ProducerCatalogPage
                key={data.id}
                profile={data}
                offerId={offerId}
                contactPhone={contactUrl ? data.telefone : undefined}
                authenticated={authenticated}
                onNavigate={onNavigate}
            />
        );
    return (
        <section className="trajectory-page public-trajectory-page">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            {loading && <p role="status">Carregando perfil…</p>}
            {error && (
                <>
                    <h1>Perfil do produtor</h1>
                    <p className="form-alert" role="alert">
                        {error}
                    </p>
                    {retryable && (
                        <ActionButton
                            variant="outline"
                            onClick={() => {
                                setData(null);
                                setLoading(true);
                                setError("");
                                setAttempt((value) => value + 1);
                            }}
                        >
                            Tentar novamente
                        </ActionButton>
                    )}
                </>
            )}
            {data && (
                <>
                    <h1>{data.nomeIniciativa || "Perfil do produtor"}</h1>
                    {data.categoriaOfertada && (
                        <p className="eyebrow">{data.categoriaOfertada}</p>
                    )}
                    {data.fotoUrl && (
                        <img
                            className="trajectory-public-photo"
                            src={photoSrc(data.fotoUrl)}
                            alt={`Foto de ${data.nomeIniciativa || "produtor"}`}
                            decoding="async"
                            onError={(event) => {
                                event.currentTarget.hidden = true;
                            }}
                        />
                    )}
                    {data.trajetoria && (
                        <>
                            <h2>Minha Trajetória</h2>
                            <p className="body-copy trajectory-public-text">
                                {data.trajetoria}
                            </p>
                        </>
                    )}
                    {data.atividades && (
                        <>
                            <h2>Produção / Experiências / Eventos</h2>
                            <p className="body-copy trajectory-public-text">
                                {data.atividades}
                            </p>
                        </>
                    )}
                    {data.telefone && (
                        <>
                            <h2>Número de Contato</h2>
                            <p className="body-copy">
                                {formatPhone(data.telefone)}
                            </p>
                        </>
                    )}
                    {data.localidade && (
                        <>
                            <h2>Localização</h2>
                            <p className="body-copy trajectory-public-text">
                                {data.localidade}
                            </p>
                        </>
                    )}
                    <div className="profile-actions">
                        <ActionButton
                            variant="orange"
                            onClick={() =>
                                onNavigate(
                                    `/produtor/${encodeURIComponent(id)}?catalogo=1`,
                                )
                            }
                        >
                            Ver catálogo desse perfil
                        </ActionButton>
                        {contactUrl && (
                            <WhatsAppContactLink
                                url={contactUrl}
                                onRequireLogin={
                                    authenticated
                                        ? undefined
                                        : () =>
                                              onNavigate(
                                                  getContactLoginRoute(
                                                      `produtor/${id}`,
                                                  ),
                                              )
                                }
                            />
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
