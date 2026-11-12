import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { listPublicProducers } from "./publicProfileService";
import { photoSrc } from "@/features/trajectory/trajectoryService";
import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import "./publicProfile.css";
import { RuralCarousel } from "./RuralCarousel";

export function ExplorePage({
    onNavigate,
}: {
    onNavigate: (path: string) => void;
}) {
    const [producers, setProducers] = useState<PublicTrajectory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Produtos");
    const [showAll, setShowAll] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        void listPublicProducers(controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setProducers(data);
            })
            .catch(() => {
                if (!controller.signal.aborted) setError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [attempt]);
    const filtered = producers.filter((producer) => {
        const text = `${producer.nomeIniciativa ?? ""} ${producer.trajetoria ?? ""} ${producer.atividades ?? ""}`;
        return (
            text
                .toLocaleLowerCase("pt-BR")
                .includes(search.toLocaleLowerCase("pt-BR").trim()) &&
            (!category || producer.categoriaOfertada?.includes(category))
        );
    });
    const visible = showAll || search.trim() ? filtered : filtered.slice(0, 2);
    return (
        <section className="explore-page" aria-label="Explorar a Cafuringa">
            <RuralCarousel />
            <label className="explore-search">
                <span aria-hidden="true">⌕</span>
                <span className="visually-hidden">
                    Buscar produtores e suas ofertas
                </span>
                <input
                    type="search"
                    placeholder="Buscar ofertas"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </label>
            <h2 className="explore-heading">O que você quer conhecer?</h2>
            <div className="explore-categories">
                <button
                    className="explore-category"
                    aria-pressed={category === "Produtos"}
                    onClick={() => {
                        setCategory("Produtos");
                        setShowAll(false);
                    }}
                >
                    <span aria-hidden="true" className="explore-category-icon">
                        <svg viewBox="0 0 48 56" focusable="false">
                            <path fill="currentColor" d="M4 20h40v34H4z" />
                            <path
                                d="M12 24V13a12 12 0 0 1 24 0v11M20 24V13a8 8 0 0 1 16 0v11"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="5"
                            />
                        </svg>
                    </span>
                    <span>
                        <strong>Produtos</strong>{" "}
                        <small>Alimentos artesanais e muito mais.</small>
                    </span>
                </button>
                <button
                    className="explore-category"
                    aria-pressed={category === "Experiências"}
                    onClick={() => {
                        setCategory("Experiências");
                        setShowAll(false);
                    }}
                >
                    <span aria-hidden="true" className="explore-category-icon">
                        <svg viewBox="0 0 56 56" focusable="false">
                            <path
                                fill="currentColor"
                                d="m37 1-8 12h5L24 25h6L18 40h15v12h7V40h15L43 25h6L39 13h6zM0 52l10-17 11 17zM14 52l8-14 8 14z"
                            />
                        </svg>
                    </span>
                    <span>
                        <strong>Experiências</strong>{" "}
                        <small>Viva a cultura local.</small>
                    </span>
                </button>
            </div>
            <div className="explore-producers-heading">
                <h2 className="explore-heading">Conheça nossos produtores</h2>
                <button
                    className="text-action"
                    aria-expanded={showAll}
                    aria-controls="public-producer-list"
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll ? "Ver menos" : "Ver tudo"}{" "}
                    <span aria-hidden="true">→</span>
                </button>
            </div>
            {loading && <p role="status">Carregando produtores…</p>}
            {error && (
                <div role="alert">
                    <p>
                        Não foi possível carregar os produtores. Verifique a
                        conexão e tente novamente.
                    </p>
                    <ActionButton
                        variant="outline"
                        onClick={() => {
                            setLoading(true);
                            setError(false);
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Tentar novamente
                    </ActionButton>
                </div>
            )}
            {!loading && !error && visible.length === 0 && (
                <p role="status">
                    {search || producers.length > 0
                        ? "Nenhum produtor encontrado para esta busca."
                        : "Ainda não há produtores disponíveis para consulta."}
                </p>
            )}
            <div className="producer-list" id="public-producer-list">
                {visible.map((producer) => (
                    <button
                        key={producer.id}
                        className="producer-card"
                        onClick={() =>
                            onNavigate(
                                `/produtor/${encodeURIComponent(producer.id)}`,
                            )
                        }
                    >
                        <span className="producer-avatar" aria-hidden="true">
                            {producer.fotoUrl ? (
                                <img
                                    src={photoSrc(producer.fotoUrl)}
                                    alt=""
                                    loading="lazy"
                                    onError={(event) => {
                                        event.currentTarget.hidden = true;
                                    }}
                                />
                            ) : (
                                <span>
                                    {(producer.nomeIniciativa || "P").slice(
                                        0,
                                        1,
                                    )}
                                </span>
                            )}
                        </span>
                        <span className="producer-card-copy">
                            <strong>
                                {producer.nomeIniciativa || "Produtor"}
                            </strong>
                            {producer.trajetoria && (
                                <span>{producer.trajetoria}</span>
                            )}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
