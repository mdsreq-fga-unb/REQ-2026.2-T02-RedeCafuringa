import { useEffect, useRef, useState } from "react";

// Fotos reais da APA da Cafuringa, em dois tamanhos para poupar dados em
// conexão rural (RNF06): o celular baixa a de 640 px.
const slides = [
    {
        name: "morro",
        description:
            "Casa no alto de um morro coberto de Cerrado, com bananeira em primeiro plano",
    },
    {
        name: "chale-frente",
        description:
            "Chalé de tijolos com varanda de madeira e portas de vidro abertas, entre árvores do Cerrado",
    },
    {
        name: "estrada",
        description: "Estrada de terra vermelha cercada de árvores",
    },
    {
        name: "chapada",
        description: "Chapada vista da rodovia, com vegetação de Cerrado",
    },
    {
        name: "chale-sol",
        description:
            "Chalé de tijolos com varanda e rede, sob céu azul com raio de sol",
    },
    {
        name: "serra",
        description: "Serra vista da estrada, com mata e capim seco",
    },
].map(({ name, description }) => ({
    image: `/images/rural/${name}-1200.webp`,
    srcSet: `/images/rural/${name}-640.webp 640w, /images/rural/${name}-1200.webp 1200w`,
    description,
}));

export function RuralCarousel() {
    const [index, setIndex] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(
        () =>
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
            false,
    );
    const [interacting, setInteracting] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const touchStart = useRef<number | null>(null);
    // Só baixa a foto visível e a próxima (RNF06); as já baixadas ficam.
    const [loaded, setLoaded] = useState<ReadonlySet<number>>(
        () => new Set([0, 1]),
    );
    const upcoming = (index + 1) % slides.length;
    if (!loaded.has(index) || !loaded.has(upcoming))
        setLoaded(new Set([...loaded, index, upcoming]));
    useEffect(() => {
        const preference = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)",
        );
        const onChange = (event: MediaQueryListEvent) =>
            setReducedMotion(event.matches);
        preference?.addEventListener("change", onChange);
        return () => preference?.removeEventListener("change", onChange);
    }, []);
    useEffect(() => {
        const onVisibility = () => setHidden(document.hidden);
        document.addEventListener("visibilitychange", onVisibility);
        return () =>
            document.removeEventListener("visibilitychange", onVisibility);
    }, []);
    useEffect(() => {
        if (reducedMotion || interacting || hidden) return;
        const timer = window.setInterval(
            () => setIndex((value) => (value + 1) % slides.length),
            6000,
        );
        return () => window.clearInterval(timer);
    }, [reducedMotion, interacting, hidden, index]);
    const select = (next: number) => {
        setIndex((next + slides.length) % slides.length);
    };
    return (
        <section
            className="explore-hero"
            aria-label="Paisagens da vida rural"
            aria-roledescription="carrossel"
            onMouseEnter={() => setInteracting(true)}
            onMouseLeave={() => setInteracting(false)}
            onFocusCapture={() => setInteracting(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setInteracting(false);
            }}
            onTouchStart={(event) => {
                touchStart.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (
                    touchStart.current !== null &&
                    end !== undefined &&
                    Math.abs(end - touchStart.current) > 45
                )
                    select(index + (end < touchStart.current ? 1 : -1));
                touchStart.current = null;
            }}
            onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    select(index + (event.key === "ArrowRight" ? 1 : -1));
                }
            }}
        >
            {slides.map((slide, position) => (
                <img
                    key={slide.image}
                    className={`explore-hero-image${position === index ? " is-active" : ""}`}
                    src={loaded.has(position) ? slide.image : undefined}
                    srcSet={loaded.has(position) ? slide.srcSet : undefined}
                    sizes="(min-width: 1200px) 1120px, 100vw"
                    alt={slide.description}
                    aria-hidden={position !== index}
                    width="1200"
                    height="650"
                    decoding="async"
                    onError={(event) => {
                        event.currentTarget.hidden = true;
                    }}
                />
            ))}
            <h1>Servimos à terra</h1>
            <button
                type="button"
                className="carousel-arrow carousel-previous"
                aria-label="Imagem anterior"
                onClick={() => select(index - 1)}
            >
                ‹
            </button>
            <button
                type="button"
                className="carousel-arrow carousel-next"
                aria-label="Próxima imagem"
                onClick={() => select(index + 1)}
            >
                ›
            </button>
            <div className="carousel-dots" aria-label="Selecionar imagem">
                {slides.map((slide, position) => (
                    <button
                        type="button"
                        key={slide.image}
                        aria-label={`Ir para imagem ${position + 1}`}
                        aria-current={position === index ? "true" : undefined}
                        onClick={() => select(position)}
                    >
                        <span />
                    </button>
                ))}
            </div>
            <span
                className="visually-hidden"
                aria-live={interacting || reducedMotion ? "polite" : "off"}
            >
                Imagem {index + 1} de {slides.length}:{" "}
                {slides[index].description}
            </span>
        </section>
    );
}
