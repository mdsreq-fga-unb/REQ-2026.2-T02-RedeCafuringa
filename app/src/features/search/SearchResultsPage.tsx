import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { OfferCards } from "@/features/offers/OfferCards";
import { productToOffer } from "@/features/offers/productOffer";
import { photoSrc } from "@/features/trajectory/trajectoryService";
import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import { ApiHttpError } from "@/shared/api";
import "@/features/profile/publicProfile.css";
import "./search.css";
import {
    searchOffers,
    type SearchGroup,
    type SearchResults,
} from "./searchService";
import { validateSearchTerm } from "./searchTerm";

type SearchFunction = (
    term: string,
    options?: { signal?: AbortSignal },
) => Promise<SearchResults>;

type Status = "idle" | "loading" | "ready" | "error";

type SearchResultsPageProps = {
    /** Termo trazido da rota (`/buscar?q=`); busca assim que a tela abre. */
    initialTerm?: string;
    onNavigate: (path: string) => void;
    search?: SearchFunction;
};

function hasResults(results: SearchResults): boolean {
    return (
        results.produtores.total +
            results.produtos.total +
            results.experiencias.total >
        0
    );
}

function ShownCount<T>({ group }: { group: SearchGroup<T> }) {
    if (group.total <= group.itens.length) return null;
    return (
        <p className="search-partial">
            {`Mostrando ${group.itens.length} de ${group.total}`}
        </p>
    );
}

/**
 * HU36: busca de ofertas aberta a visitantes (CA09). Valida o termo antes de
 * chamar a API (CA08), mostra os resultados por tipo (CA03, CA04) e deixa
 * abrir cada um (CA05) ou buscar de novo (CA07).
 */
export function SearchResultsPage({
    initialTerm = "",
    onNavigate,
    search = searchOffers,
}: SearchResultsPageProps) {
    const inputId = useId();
    const errorId = useId();
    const [value, setValue] = useState(initialTerm);
    const [status, setStatus] = useState<Status>(() =>
        validateSearchTerm(initialTerm).ok ? "loading" : "idle",
    );
    const [results, setResults] = useState<SearchResults | null>(null);
    const [problem, setProblem] = useState<string | null>(() => {
        const checked = validateSearchTerm(initialTerm);
        return initialTerm && !checked.ok ? checked.message : null;
    });
    const lastTerm = useRef("");
    const current = useRef<AbortController | null>(null);

    /** Faz a chamada; só atualiza o estado quando a resposta chega. */
    function fetchTerm(term: string) {
        current.current?.abort();
        const controller = new AbortController();
        current.current = controller;
        lastTerm.current = term;
        search(term, { signal: controller.signal }).then(
            (found) => {
                if (controller.signal.aborted) return;
                setResults(found);
                setStatus("ready");
            },
            (error: unknown) => {
                if (controller.signal.aborted) return;
                if (
                    error instanceof ApiHttpError &&
                    error.status === 400 &&
                    error.details.length > 0
                ) {
                    setProblem(error.details.join(" "));
                    setResults(null);
                    setStatus("idle");
                    return;
                }
                setResults(null);
                setStatus("error");
            },
        );
    }

    function run(raw: string) {
        const checked = validateSearchTerm(raw);
        if (!checked.ok) {
            current.current?.abort();
            setProblem(checked.message);
            setResults(null);
            setStatus("idle");
            return;
        }
        setProblem(null);
        setStatus("loading");
        fetchTerm(checked.term);
    }

    useEffect(() => {
        // Só a abertura da tela usa o termo da rota; as buscas seguintes vêm do campo.
        const checked = validateSearchTerm(initialTerm);
        if (checked.ok) fetchTerm(checked.term);
        const controller = current;
        return () => controller.current?.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        run(value);
    }

    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/explorar")}
            />
            <section
                className="catalog-page product-catalog search-page"
                aria-labelledby="search-title"
                aria-busy={status === "loading"}
            >
                <h1 id="search-title">Buscar ofertas</h1>
                <form
                    role="search"
                    aria-label="Buscar ofertas"
                    className="search-form"
                    noValidate
                    onSubmit={submit}
                >
                    <label htmlFor={inputId}>O que você procura?</label>
                    <div className="search-row">
                        <input
                            id={inputId}
                            type="search"
                            value={value}
                            placeholder="Produtos, experiências ou produtores"
                            autoComplete="off"
                            aria-invalid={problem ? true : undefined}
                            aria-describedby={problem ? errorId : undefined}
                            onChange={(event) => setValue(event.target.value)}
                        />
                        <ActionButton variant="orange" type="submit">
                            Buscar
                        </ActionButton>
                    </div>
                    {problem && (
                        <p id={errorId} role="alert" className="field-error">
                            {problem}
                        </p>
                    )}
                </form>

                {status === "loading" && <p role="status">Buscando ofertas…</p>}

                {status === "error" && (
                    <div role="alert">
                        <p>
                            Não foi possível realizar a busca. Verifique a
                            conexão e tente novamente.
                        </p>
                        <ActionButton
                            variant="outline"
                            type="button"
                            onClick={() => run(lastTerm.current)}
                        >
                            Tentar novamente
                        </ActionButton>
                    </div>
                )}

                {status === "ready" && results && !hasResults(results) && (
                    <div role="status" className="search-empty">
                        <p>{`Nenhum resultado encontrado para “${results.termo}”.`}</p>
                        <p>Tente outras palavras ou confira a grafia.</p>
                    </div>
                )}

                {status === "ready" && results && hasResults(results) && (
                    <>
                        <h2>{`Resultados para “${results.termo}”`}</h2>
                        {results.produtores.total > 0 && (
                            <section aria-labelledby="search-producers">
                                <h2 id="search-producers">{`Produtores (${results.produtores.total})`}</h2>
                                <ul className="search-producers">
                                    {results.produtores.itens.map(
                                        (producer: PublicTrajectory) => (
                                            <li key={producer.id}>
                                                <button
                                                    type="button"
                                                    className="producer-card"
                                                    onClick={() =>
                                                        onNavigate(
                                                            `/produtor/${encodeURIComponent(producer.id)}`,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className="producer-avatar"
                                                        aria-hidden="true"
                                                    >
                                                        {producer.fotoUrl ? (
                                                            <img
                                                                src={photoSrc(
                                                                    producer.fotoUrl,
                                                                )}
                                                                alt=""
                                                                loading="lazy"
                                                                onError={(
                                                                    event,
                                                                ) => {
                                                                    event.currentTarget.hidden = true;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>
                                                                {(
                                                                    producer.nomeIniciativa ||
                                                                    "P"
                                                                ).slice(0, 1)}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="producer-card-copy">
                                                        <strong>
                                                            {producer.nomeIniciativa ||
                                                                "Produtor"}
                                                        </strong>
                                                        {producer.trajetoria && (
                                                            <span>
                                                                {
                                                                    producer.trajetoria
                                                                }
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </li>
                                        ),
                                    )}
                                </ul>
                                <ShownCount group={results.produtores} />
                            </section>
                        )}
                        {results.produtos.total > 0 && (
                            <section aria-labelledby="search-products">
                                <h2 id="search-products">{`Produtos (${results.produtos.total})`}</h2>
                                <OfferCards
                                    offers={results.produtos.itens.map(
                                        productToOffer,
                                    )}
                                    onNavigate={onNavigate}
                                />
                                <ShownCount group={results.produtos} />
                            </section>
                        )}
                        {results.experiencias.total > 0 && (
                            <section aria-labelledby="search-experiences">
                                <h2 id="search-experiences">{`Experiências (${results.experiencias.total})`}</h2>
                                <OfferCards
                                    offers={results.experiencias.itens.map(
                                        productToOffer,
                                    )}
                                    onNavigate={onNavigate}
                                />
                                <ShownCount group={results.experiencias} />
                            </section>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
