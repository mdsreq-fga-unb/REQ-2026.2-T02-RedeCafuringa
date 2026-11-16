import { useEffect, useRef } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import "./product-registration.css";

export function ProductPublishedPage({
    id,
    onNavigate,
}: {
    id: string;
    onNavigate: (path: string) => void;
}) {
    const title = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        title.current?.focus();
    }, []);
    return (
        <section className="product-registration product-success">
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/catalogo")}
            />
            <div className="product-success-content">
                <span className="product-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                        <path d="m5 12 4 4L19 6" />
                    </svg>
                </span>
                <h1 ref={title} tabIndex={-1}>
                    Sua oferta está na rede
                </h1>
                <p role="status">
                    O cadastro foi concluído e sua oferta está disponível para
                    consulta.
                </p>
                <button
                    className="product-submit"
                    onClick={() =>
                        onNavigate(`/oferta/${encodeURIComponent(id)}`)
                    }
                >
                    Visualizar
                </button>
            </div>
        </section>
    );
}
