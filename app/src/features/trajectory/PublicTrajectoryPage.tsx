import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { ApiHttpError } from "@/shared/api";
import { formatPhone } from "@/features/register/validators";
import { getPublicTrajectory, photoSrc } from "./trajectoryService";
import type { PublicTrajectory } from "./trajectoryService";
import { ProducerCatalogPage } from "@/features/profile/ProducerCatalogPage";
import {
    createWhatsAppUrl,
    isWhatsAppContactAvailable,
} from "@/features/contact";
import "./trajectory.css";
import "@/features/profile/publicProfile.css";

export function PublicTrajectoryPage({
    id,
    onNavigate,
    catalogView = false,
    offerId,
    consumer = false,
}: {
    id: string;
    onNavigate: (path: string) => void;
    catalogView?: boolean;
    offerId?: string;
    consumer?: boolean;
}) {
    const [data, setData] = useState<PublicTrajectory | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        void getPublicTrajectory(id, controller.signal)
            .then((profile) => {
                if (!controller.signal.aborted) setData(profile);
            })
            .catch((cause: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        cause instanceof ApiHttpError && cause.status === 404
                            ? "Perfil indisponível ou não encontrado."
                            : "Não foi possível carregar este perfil. Verifique a conexão e tente novamente.",
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [id, attempt]);
    const contactAvailable = Boolean(
        data?.telefone && isWhatsAppContactAvailable(true, data.telefone),
    );
    const startContact = () => {
        if (!data?.telefone || !contactAvailable) return;
        if (!consumer) {
            onNavigate(
                `/entrar?contato=${encodeURIComponent(`produtor/${id}`)}`,
            );
            return;
        }
        const digits = data.telefone.replace(/\D/g, "");
        const number = digits.length <= 11 ? `55${digits}` : digits;
        window.open(
            createWhatsAppUrl(
                number,
                `Perfil de ${data.nomeIniciativa || "produtor"}`,
            ),
            "_blank",
            "noopener,noreferrer",
        );
    };
    if (data && catalogView)
        return (
            <ProducerCatalogPage
                key={data.id}
                profile={data}
                offerId={offerId}
                contactAvailable={contactAvailable}
                consumer={consumer}
                onNavigate={onNavigate}
                onStartContact={startContact}
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
                        {contactAvailable && (
                            <ActionButton
                                variant="green"
                                onClick={startContact}
                            >
                                Conversar pelo WhatsApp
                            </ActionButton>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
