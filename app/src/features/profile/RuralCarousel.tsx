import { useEffect, useRef, useState } from "react";

const slides = [
    {
        image: "/images/rural/campos.webp",
        description: "Paisagem rural ao pôr do sol",
    },
    {
        image: "/images/rural/cultivo.webp",
        description: "Cultivo e trabalho no campo",
    },
    {
        image: "/images/rural/horta.webp",
        description: "Horta e alimentos cultivados na terra",
    },
];

export function RuralCarousel() {
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [interacting, setInteracting] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const touchStart = useRef<number | null>(null);
    useEffect(() => {
        const onVisibility = () => setHidden(document.hidden);
        document.addEventListener("visibilitychange", onVisibility);
        return () =>
            document.removeEventListener("visibilitychange", onVisibility);
    }, []);
    useEffect(() => {
        if (!playing || interacting || hidden) return;
        const timer = window.setInterval(
            () => setIndex((value) => (value + 1) % slides.length),
            6000,
        );
        return () => window.clearInterval(timer);
    }, [playing, interacting, hidden]);
    const select = (next: number) => {
        setPlaying(false);
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
            <img
                key={index}
                className="explore-hero-image"
                src={slides[index].image}
                alt={slides[index].description}
                width="1200"
                height="650"
                decoding="async"
                onError={(event) => {
                    event.currentTarget.hidden = true;
                }}
            />
            <h1>Servimos a terra.</h1>
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
            <button
                type="button"
                className="carousel-play"
                aria-label={
                    playing ? "Pausar carrossel" : "Reproduzir carrossel"
                }
                onClick={() => {
                    setPlaying(!playing);
                    setInteracting(false);
                }}
            >
                {playing ? "Ⅱ" : "▶"}
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
                aria-live={playing ? "off" : "polite"}
            >
                Imagem {index + 1} de {slides.length}:{" "}
                {slides[index].description}
            </span>
        </section>
    );
}
